import { NextRequest, NextResponse } from "next/server";
import { sendLeadToCRM, splitName, type CrmTypeProjet } from "@/lib/crm";
import { checkSimulationRateLimit } from "@/lib/rate-limit";
import { getProject, type ProjectType } from "@/app/simulation/projects";
import { buildImagePrompt } from "@/lib/simulation-prompt";

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
   TYPES
────────────────────────────────────────────────────────────────── */
interface ElementInfo {
  ref: string;
  name: string;
  famille: string;
  finition?: string;
  categorie?: string;
  tags?: string[];
  imageUrl?: string;
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

/* ──────────────────────────────────────────────────────────────────
   SEND LEAD TO CRM — utilise le helper centralisé lib/crm.ts
   Enrichit avec: referenceChoisie, mlEstimes, prixDevis, lienSimulation
────────────────────────────────────────────────────────────────── */
/* ── Mapping project_type → CRM typeProjet ── */
const CRM_TYPE_MAP: Record<string, CrmTypeProjet> = {
  cuisine: "CUISINE",
  "salle-de-bain": "SDB",
  meubles: "MEUBLES",
  "mur-plafond": "AUTRE",
  professionnel: "PRO",
};

function pushLeadToCrm(body: Record<string, string>, resultImage?: string) {
  if (!body.name || !body.phone) return;

  const { prenom, nom } = splitName(body.name);
  const projectType = body.project_type || "cuisine";

  // Collecte dynamique des refs zone1/zone2/zone3
  const refs = ["zone1", "zone2", "zone3"]
    .map((z) => {
      const ref = body[`${z}_ref`];
      const label = body[`${z}_label`] || z;
      const name = body[`${z}_name`] || "";
      return ref ? `${label} ${ref} (${name})` : null;
    })
    .filter(Boolean)
    .join(" | ");

  const referenceChoisie =
    body.zone1_ref || body.zone2_ref || body.zone3_ref || undefined;

  const mlEstimes = body.ml ? Number(body.ml) : undefined;
  const prixDevis = body.prix_devis ? Number(body.prix_devis) : undefined;

  const notesParts = [
    `Simulation IA ${projectType} en ligne`,
    refs,
    mlEstimes ? `${mlEstimes}ml` : null,
    prixDevis ? `${prixDevis}€` : null,
    body.message ? `Message: ${body.message}` : null,
  ].filter(Boolean);

  sendLeadToCRM({
    prenom,
    nom,
    telephone: body.phone,
    email: body.email || undefined,
    source: "SITE_SIMULATEUR",
    typeProjet: CRM_TYPE_MAP[projectType] || "AUTRE",
    referenceChoisie,
    mlEstimes: Number.isFinite(mlEstimes) ? mlEstimes : undefined,
    prixDevis: Number.isFinite(prixDevis) ? prixDevis : undefined,
    lienSimulation: body.lien_simulation || undefined,
    notes: notesParts.join(" — "),
    imageBefore: body.photo_base64 || undefined,
    imageAfter: resultImage || undefined,
  }).catch((err) => {
    console.error("[/api/simulation] CRM helper threw (ne devrait pas):", err);
  });
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

  if (!body.name || !body.phone || !body.email) {
    return NextResponse.json({ error: "Nom, téléphone et email requis." }, { status: 400 });
  }
  if (!body.photo_base64) {
    return NextResponse.json({ error: "Photo requise." }, { status: 400 });
  }

  /* ── Créer le lead dans le CRM dès maintenant (avant génération image) ── */
  pushLeadToCrm(body);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("REPLACE")) {
    return NextResponse.json({ error: "Clé API OpenAI non configurée." }, { status: 500 });
  }

  /* ── Parse elements (generic: zone1, zone2, zone3) ── */
  const elements: Record<string, ElementInfo | null> = {};
  for (const zoneKey of ["zone1", "zone2", "zone3"]) {
    const ref = body[`${zoneKey}_ref`];
    if (ref) {
      elements[zoneKey] = {
        ref,
        name: body[`${zoneKey}_name`] || "",
        famille: body[`${zoneKey}_famille`] || "",
        finition: body[`${zoneKey}_finition`],
        categorie: body[`${zoneKey}_categorie`],
        tags: body[`${zoneKey}_tags`],
        imageUrl: body[`${zoneKey}_image`],
      };
    } else {
      elements[zoneKey] = null;
    }
  }

  try {
    /* ══════════════════════════════════════════════════════════════
       STEP 1: Download texture reference images in parallel
       BUG FIX : si un swatch échoue à se télécharger, on échoue PROPREMENT
       au lieu de laisser l'IA inventer une couleur (ancien comportement).
    ══════════════════════════════════════════════════════════════ */
    const textureEntries: { key: string; el: ElementInfo; buffer: Buffer }[] = [];
    const downloadResults = await Promise.all(
      Object.entries(elements).map(async ([key, el]) => {
        if (!el?.imageUrl) return { key, el, buffer: null as Buffer | null };
        const buffer = await downloadImage(el.imageUrl);
        return { key, el, buffer };
      })
    );

    const failedDownloads: { key: string; ref: string; name: string }[] = [];
    for (const { key, el, buffer } of downloadResults) {
      if (!el) continue;
      if (el.imageUrl && !buffer) {
        // Swatch attendu mais échec → on rejette (ne pas laisser l'IA inventer)
        failedDownloads.push({ key, ref: el.ref, name: el.name });
      } else if (buffer && el) {
        textureEntries.push({ key, el, buffer });
      }
    }

    if (failedDownloads.length > 0) {
      const refs = failedDownloads.map((f) => `${f.ref} (${f.name})`).join(", ");
      console.error(`[simulation] Swatch download failed for: ${refs}`);
      return NextResponse.json(
        {
          error: `Impossible de télécharger les images de référence (${refs}). Réessayez dans quelques secondes.`,
          reason: "swatch-download-failed",
        },
        { status: 502, headers: rateLimitHeaders(rl) }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[simulation] Downloaded ${textureEntries.length} texture reference images`);
    }

    /* ══════════════════════════════════════════════════════════════
       STEP 2: Build the image edit prompt (no GPT-4.1-mini needed)
       Direct, precise prompt with visual references
    ══════════════════════════════════════════════════════════════ */

    // Map each element to its texture image index (if available)
    const imageIndexMap: Record<string, number | null> = {};
    for (const zk of ["zone1", "zone2", "zone3"]) imageIndexMap[zk] = null;
    textureEntries.forEach((entry, idx) => {
      imageIndexMap[entry.key] = idx;
    });

    // Labels dynamiques par zone (envoyés par le front)
    const zoneLabels: Record<string, string> = {
      zone1: body.zone1_label || "Zone 1",
      zone2: body.zone2_label || "Zone 2",
      zone3: body.zone3_label || "Zone 3",
    };

    // Contexte du type de projet pour le prompt — source unique : src/app/simulation/projects.ts
    const projectType = body.project_type || "cuisine";
    const project: ProjectType = getProject(projectType);

    // Prompt construit via la lib partagée (source unique : src/lib/simulation-prompt.ts)
    const imagePrompt = buildImagePrompt({
      project,
      zoneLabels,
      elements,
      imageIndexMap,
      swatchCount: textureEntries.length,
    });

    /* ══════════════════════════════════════════════════════════════
       STEP 3: Call OpenAI Image Edit with all images
    ══════════════════════════════════════════════════════════════ */
    const rawBase64 = body.photo_base64.replace(/^data:image\/\w+;base64,/, "");
    const kitchenBuffer = Buffer.from(rawBase64, "base64");

    // Detect orientation to pick best matching output size
    // gpt-image-1 supports: 1024x1024, 1536x1024 (landscape), 1024x1536 (portrait)
    // We pick the size that best matches the input aspect ratio to avoid any zoom/crop effect
    const dims = getImageDimensions(kitchenBuffer);
    let outputSize = "1024x1024";
    if (dims) {
      const ratio = dims.width / dims.height;
      // Phone landscape (16:9, 4:3) → landscape output
      if (ratio > 1.15) outputSize = "1536x1024";
      // Phone portrait (9:16, 3:4) → portrait output
      else if (ratio < 0.85) outputSize = "1024x1536";
      // Near-square photos → square output (best match)
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(`[simulation] Input: ${dims?.width}x${dims?.height} (ratio ${dims ? (dims.width / dims.height).toFixed(2) : "?"}) → output: ${outputSize}`);
    }

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
      formData.append("model", "gpt-image-1");
      formData.append("prompt", imagePrompt);
      formData.append("size", outputSize);
      formData.append("quality", quality);
      formData.append("image[]", new Blob([new Uint8Array(kitchenBuffer)], { type: "image/png" }), "kitchen.png");
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

    // Photo refusée par OpenAI (4xx hors 429) : retry inutile, abandon immédiat.
    if (!attempt.ok && attempt.isUserError) {
      const userMessage =
        attempt.status === 400
          ? "L'IA a refusé cette photo (probablement trop sombre, floue ou non conforme). Essayez une autre photo bien éclairée."
          : "Erreur lors de la génération. Réessayez ou contactez-nous.";
      return NextResponse.json(
        { error: userMessage, reason: "openai-user-error", status: attempt.status },
        { status: 502, headers: rateLimitHeaders(rl) }
      );
    }

    // Échec RAPIDE non-timeout (5xx/réseau/réponse vide) + budget suffisant → 1 retry.
    if (!attempt.ok && !attempt.isTimeout && remainingBudget() > MIN_RETRY_BUDGET_MS) {
      console.log(`[simulation] Échec rapide (status ${attempt.status ?? "?"}), retry low — budget restant ${Math.round(remainingBudget() / 1000)}s`);
      attempt = await attemptOpenAI("low", remainingBudget());
    }

    if (!attempt.ok) {
      console.error(`[simulation] Génération échouée (${attempt.isTimeout ? "timeout" : "status " + attempt.status})`);
      // Le lead + la photo sont DÉJÀ enregistrés dans le CRM (pushLeadToCrm au
      // début). On ne perd donc jamais le contact : message rassurant orienté
      // conversion plutôt qu'un "Oups erreur" sec.
      return NextResponse.json(
        {
          error:
            "Nos serveurs de génération sont très sollicités à l'instant. Bonne nouvelle : votre demande est bien enregistrée — nous vous recontactons très vite avec votre simulation. Vous pouvez aussi réessayer dans un instant.",
          reason: attempt.isTimeout ? "openai-timeout" : "openai-error",
        },
        { status: attempt.isTimeout ? 504 : 502, headers: rateLimitHeaders(rl) }
      );
    }

    const resultImage = `data:image/png;base64,${attempt.b64}`;

    /* ── Send lead to CRM (fire-and-forget) ── */
    pushLeadToCrm(body, resultImage);

    return NextResponse.json(
      {
        success: true,
        image: resultImage,
        references: {
          credence: body.credence_ref || "",
          plan: body.plan_ref || "",
          facade: body.facade_ref || "",
        },
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
    return NextResponse.json({ error: "Service indisponible." }, { status: 502 });
  }
}
