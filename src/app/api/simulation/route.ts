import { NextRequest, NextResponse } from "next/server";
import { MESSAGE_CAPTCHA, verifierTurnstile } from "@/lib/turnstile";
import { parcoursIdValide } from "@/lib/parcours";
import { checkSimulationRateLimit } from "@/lib/rate-limit";
import { getProject, type ProjectType } from "@/lib/simulateur/projets";
import { buildImagePrompt } from "@/lib/simulation-prompt";
import { lireSelections } from "@/lib/simulateur/selections";
import { rognerAuFormat, tailleSelonRatio } from "@/lib/simulateur/cadrage";
import { MESSAGES_ECHEC, classerErreurOpenAI } from "@/lib/simulateur/erreurs-generation";

// Max duration côté Vercel (Hobby = 60s max, Pro = 300s).
// gpt-image-1 quality "medium" 1024px → ~20-35s, large marge avant kill.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Stratégie multi-tentatives avec budget de temps STRICT (60s Vercel max) :
//
//   Tentative 1 : quality "medium" (~30-40s typique, meilleure fidélité) avec 35s timeout
//   Tentative 2 (si 5xx ou timeout) : quality "low" (~15-25s typique) avec 18s timeout
//   Total worst-case : 35 + 18 = 53s, marge 7s avant kill Vercel.
//
// Pourquoi pas retry sur 4xx : si OpenAI refuse la photo (trop sombre, floue,
// politique), c'est une erreur user — retry ne changera rien et brûle le budget.
//
// Pourquoi medium en premier : ~80% des requêtes passent en medium sans timeout,
// avec meilleure qualité visuelle. Le fallback low ne se déclenche que pour les
// rares photos complexes ou les pics de latence OpenAI.
// Budget temps TOTAL alloué à OpenAI avant qu'on rende la main proprement
// (Vercel Hobby kill à 60s). On garde 7s de marge pour le download des swatches
// + la sérialisation de la réponse.
const TOTAL_OPENAI_BUDGET_MS = 53_000;
// On ne relance une 2e tentative QUE si l'échec est rapide (5xx/réseau, pas un
// timeout) ET qu'il reste assez de budget. Sinon, sur OpenAI lent, on laisse le
// 1er essai utiliser tout le budget.
const MIN_RETRY_BUDGET_MS = 20_000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    ...(result.retryAfterSec > 0 ? { "Retry-After": String(result.retryAfterSec) } : {}),
  };
}

/* ──────────────────────────────────────────────────────────────────
   DETECT IMAGE DIMENSIONS FROM BUFFER (JPEG/PNG)
────────────────────────────────────────────────────────────────── */
function getImageDimensions(buf: Buffer): { width: number; height: number } | null {
  // PNG: bytes 16-23 contain width (4 bytes) and height (4 bytes) in IHDR
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  }
  // JPEG: scan for SOF0 (0xFFC0) or SOF2 (0xFFC2) marker
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xff) { offset++; continue; }
      const marker = buf[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height };
      }
      const segLen = buf.readUInt16BE(offset + 2);
      offset += 2 + segLen;
    }
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────
   DOWNLOAD IMAGE AS BUFFER
────────────────────────────────────────────────────────────────── */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/simulation
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  /* ── Rate limit journalier (5/jour/IP + cap global 80/jour) ── */
  const rl = checkSimulationRateLimit(ip);
  if (!rl.ok) {
    const resetDate = new Date(rl.resetAt);
    const hoursLeft = Math.ceil((rl.resetAt - Date.now()) / (60 * 60 * 1000));
    const message =
      rl.reason === "global-quota"
        ? "Le quota quotidien de simulations gratuites est atteint pour l'ensemble du site. Réessayez demain ou demandez un devis pour une simulation prioritaire."
        : `Vous avez atteint la limite de ${rl.limit} simulations gratuites par jour. Nouveau crédit dans ${hoursLeft} h (${resetDate.toLocaleString("fr-FR")}).`;

    return NextResponse.json(
      { error: message, reason: rl.reason, resetAt: rl.resetAt },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const body = await req.json();

  if (body.website) {
    return NextResponse.json({ success: true, image: "" });
  }

  // Repli du simulateur v2 : le parcours identifie la simulation ; les coordonnées
  // viennent après le résultat (/api/simulation/contact) avec le rendu.
  if (!parcoursIdValide(body.parcoursId)) {
    return NextResponse.json({ error: "Identifiant de parcours manquant : rechargez la page.", reason: "parcours" }, { status: 400 });
  }
  if (!body.photo_base64) {
    return NextResponse.json({ error: "Photo requise." }, { status: 400 });
  }

  const captcha = await verifierTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) {
    console.warn(`[/api/simulation] captcha refusé (${captcha.raison}) ip=${ip}`);
    return NextResponse.json({ error: MESSAGE_CAPTCHA, reason: "captcha" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("REPLACE")) {
    console.error("[simulation] OPENAI_API_KEY absente : génération impossible");
    return NextResponse.json({ error: MESSAGES_ECHEC["service-indisponible"], reason: "service-indisponible" }, { status: 503 });
  }

  /* ── Surfaces choisies (références relues dans le catalogue du site) ── */
  const project: ProjectType = getProject(typeof body.project_type === "string" ? body.project_type : "cuisine");
  const lecture = lireSelections(body, project);
  if (!lecture.ok) return NextResponse.json({ error: lecture.erreur, reason: lecture.raison }, { status: 400 });
  const { choix, swatchUrls } = lecture;

  try {
    /* ══════════════════════════════════════════════════════════════
       STEP 1: Download texture reference images in parallel
       BUG FIX : si un swatch échoue à se télécharger, on échoue PROPREMENT
       au lieu de laisser l'IA inventer une couleur (ancien comportement).
    ══════════════════════════════════════════════════════════════ */
    const buffers = await Promise.all(swatchUrls.map((url) => downloadImage(url)));
    const manquants = swatchUrls.filter((_, i) => !buffers[i]);
    if (manquants.length > 0) {
      const refs = choix.filter((c) => manquants.includes(c.revetement.imageUrl ?? "")).map((c) => `${c.revetement.ref} (${c.revetement.name})`).join(", ");
      console.error(`[simulation] échantillon(s) introuvable(s) : ${refs}`);
      return NextResponse.json(
        { error: `L'échantillon de ${refs} ne répond pas pour le moment : choisissez une autre finition ou réessayez dans un instant. Votre photo est conservée.`, reason: "swatch-download-failed" },
        { status: 502, headers: rateLimitHeaders(rl) }
      );
    }
    const textureEntries = buffers.map((buffer, i) => ({ key: String(i), buffer: buffer as Buffer }));

    // Consigne construite par la source unique (src/lib/simulation-prompt.ts)
    const imagePrompt = buildImagePrompt({ project, choix });

    /* ══════════════════════════════════════════════════════════════
       STEP 3: Call OpenAI Image Edit with all images
    ══════════════════════════════════════════════════════════════ */
    const rawBase64 = body.photo_base64.replace(/^data:image\/\w+;base64,/, "");
    const kitchenBuffer = Buffer.from(rawBase64, "base64");

    // Detect orientation to pick best matching output size
    // gpt-image-1 supports: 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait)
    // We pick the size that best matches the input aspect ratio to avoid any zoom/crop effect
    // Photo mise au format du modèle (rognée, centrée) : le rendu garde le même cadrage que l'« avant » renvoyé.
    const dims = getImageDimensions(kitchenBuffer);
    const outputSize = dims ? tailleSelonRatio(dims.width, dims.height) : "1024x1024";
    const cadree = await rognerAuFormat(kitchenBuffer, outputSize);

    /* ══════════════════════════════════════════════════════════════
       STEP 3: Helper — Appel OpenAI avec quality + timeout configurable.
       Retourne { ok, b64?, status?, isTimeout?, isUserError? } pour permettre
       au caller de décider du retry.
    ══════════════════════════════════════════════════════════════ */
    type AttemptResult =
      | { ok: true; b64: string; quality: string }
      | { ok: false; status?: number; isTimeout?: boolean; isUserError?: boolean; raw?: string };

    async function attemptOpenAI(quality: "low" | "medium", timeoutMs: number): Promise<AttemptResult> {
      const formData = new FormData();
      formData.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
      formData.append("prompt", imagePrompt);
      formData.append("size", outputSize);
      formData.append("quality", quality);
      formData.append("image[]", new Blob([new Uint8Array(cadree.photo)], { type: "image/png" }), "photo.png");
      for (const entry of textureEntries) {
        formData.append("image[]", new Blob([new Uint8Array(entry.buffer)], { type: "image/jpeg" }), `texture_${entry.key}.jpg`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const startMs = Date.now();
      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timeoutId);
        const isAbort = err instanceof Error && (err.name === "AbortError" || /aborted/i.test(err.message));
        console.error(`[simulation] OpenAI quality=${quality} ${isAbort ? "timeout" : "error"} après ${Date.now() - startMs}ms:`, err);
        return { ok: false, isTimeout: isAbort };
      }
      clearTimeout(timeoutId);

      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        console.error(`[simulation] OpenAI quality=${quality} HTTP ${res.status} après ${Date.now() - startMs}ms:`, raw.slice(0, 300));
        // 4xx user errors (sauf 429 rate limit) : pas de retry, ça ne changera pas
        const isUserError = res.status >= 400 && res.status < 500 && res.status !== 429;
        return { ok: false, status: res.status, isUserError, raw: raw.slice(0, 300) };
      }

      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) {
        console.error(`[simulation] OpenAI quality=${quality} sans b64_json:`, JSON.stringify(data).slice(0, 300));
        return { ok: false };
      }

      console.log(`[simulation] OpenAI quality=${quality} OK en ${Date.now() - startMs}ms`);
      return { ok: true, b64, quality };
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[simulation] Sending ${1 + textureEntries.length} images to gpt-image-1 (prompt ${imagePrompt.length} chars)`);
    }

    /* ══════════════════════════════════════════════════════════════
       STEP 4: Stratégie single-shot "low" + budget dynamique.

       gpt-image-1 quality "low" est le plus rapide (~15-26s typique) tout en
       restant photoréaliste (la fidélité couleur vient du prompt strict, pas
       du niveau de qualité). On lui donne TOUT le budget restant (≈53s) en un
       seul essai → maximise les chances de finir avant le kill Vercel 60s.

       On ne relance une 2e fois QUE si le 1er essai échoue VITE et SANS être un
       timeout (ex: 5xx ou blip réseau OpenAI) ET qu'il reste assez de budget.
       Sur OpenAI lent (timeout), pas de retry : ça ne ferait que rebrûler du
       temps qu'on n'a pas.

       L'ancienne stratégie medium(35s)→low(18s) gaspillait 35s sur un medium
       qui timeout quand OpenAI est congestionné, ne laissant que 18s au low →
       double échec = 504. C'est exactement ce qui faisait perdre des clients.
    ══════════════════════════════════════════════════════════════ */
    const genStart = Date.now();
    const remainingBudget = () => TOTAL_OPENAI_BUDGET_MS - (Date.now() - genStart);

    let attempt = await attemptOpenAI("low", remainingBudget());

    // Refus net d'OpenAI (4xx hors 429) : relancer ne changerait rien. On dit au visiteur
    // ce qui se passe vraiment : une panne chez nous (crédit, clé) n'est pas un défaut de sa photo.
    if (!attempt.ok && attempt.isUserError) {
      const raison = classerErreurOpenAI(attempt.status, attempt.raw);
      console.error(`[simulation] génération refusée (${raison}) status=${attempt.status}`);
      return NextResponse.json({ error: MESSAGES_ECHEC[raison], reason: raison, status: attempt.status }, { status: raison === "service-indisponible" ? 503 : 502, headers: rateLimitHeaders(rl) });
    }

    // Échec RAPIDE non-timeout (5xx/réseau/réponse vide) + budget suffisant → 1 retry.
    if (!attempt.ok && !attempt.isTimeout && remainingBudget() > MIN_RETRY_BUDGET_MS) {
      console.log(`[simulation] Échec rapide (status ${attempt.status ?? "?"}), retry low — budget restant ${Math.round(remainingBudget() / 1000)}s`);
      attempt = await attemptOpenAI("low", remainingBudget());
    }

    if (!attempt.ok) {
      const raison = attempt.isTimeout ? "delai" : classerErreurOpenAI(attempt.status, attempt.raw);
      console.error(`[simulation] génération échouée (${raison}) status=${attempt.status ?? "?"}`);
      // Aucune coordonnée n'a encore été donnée à ce stade : on ne promet pas un rappel,
      // on propose de réessayer ou de laisser ses coordonnées (la photo reste en mémoire).
      return NextResponse.json({ error: MESSAGES_ECHEC[raison], reason: raison }, { status: attempt.isTimeout ? 504 : raison === "service-indisponible" ? 503 : 502, headers: rateLimitHeaders(rl) });
    }

    const resultImage = `data:image/png;base64,${attempt.b64}`;

    /* ── Rendu terminé : le navigateur garde le rendu et l'enverra avec la demande de devis ── */
    return NextResponse.json(
      {
        success: true,
        image: resultImage,
        imageAvant: cadree.avant ? `data:image/jpeg;base64,${cadree.avant.toString("base64")}` : null,
        references: choix.map((c) => ({ surface: c.surface.id, ref: c.revetement.ref })),
        rateLimit: {
          limit: rl.limit,
          remaining: rl.remaining,
          resetAt: rl.resetAt,
        },
      },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (err) {
    console.error("Simulation error:", err);
    return NextResponse.json({ error: MESSAGES_ECHEC.erreur, reason: "erreur" }, { status: 502 });
  }
}
