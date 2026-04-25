import { NextRequest, NextResponse } from "next/server";
import { sendLeadToCRM, splitName, type CrmTypeProjet } from "@/lib/crm";
import { checkSimulationRateLimit } from "@/lib/rate-limit";
import { getProject, type ProjectType } from "@/app/simulation/projects";

// Max duration côté Vercel (Hobby = 60s max, Pro = 300s).
// gpt-image-1 quality "medium" 1024px → ~20-35s, large marge avant kill.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Timeout interne — on échoue PROPREMENT avant que Vercel kill la fonction (60s max).
// Stratégie : single attempt quality "low" (~15-25s typique), pas de retry pour
// rester en-dessous de 45s avec marge confortable. La qualité "low" reste
// largement photoréaliste et la fidélité couleur est préservée par le prompt.
const OPENAI_TIMEOUT_MS = 45_000;

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
   BUILD ELEMENT DESCRIPTION FOR PROMPT
   Renforcé : enforce strict pour la fidélité couleur (bug fréquent
   gpt-image-1 qui "interprète" librement les swatches couleur unie).
────────────────────────────────────────────────────────────────── */
function describeElement(label: string, el: ElementInfo | null, imageIndex: number | null): string {
  if (!el || !el.ref) {
    return `${label}: ⛔ DO NOT TOUCH. This surface MUST remain 100% pixel-identical to the original photo. No color shift, no texture change, no alteration whatsoever.`;
  }

  // Pour les couleurs unies (famille=couleur), le nom est le signal le plus fort.
  // Le swatch montre la teinte exacte mais le modèle a tendance à la "stylizer".
  // On insiste donc explicitement sur le nom anglais (Lacquered Black, Sun Flower Yellow, etc).
  const isSolidColor = el.famille === "couleur";
  const colorEmphasis = isSolidColor
    ? `🎯 EXACT SOLID COLOR REQUIRED — "${el.name}". This is a flat, uniform color (no texture, no pattern, no grain). The output color MUST exactly match "${el.name}" sampled from IMAGE ${imageIndex !== null ? imageIndex + 2 : "?"}. Do NOT lighten, darken, desaturate, or stylize. The color hex value visible on the swatch is the ONLY acceptable color.`
    : `🎯 EXACT MATERIAL REQUIRED — "${el.name}" (${el.famille}${el.categorie ? ", " + el.categorie : ""}${el.finition ? ", " + el.finition + " finish" : ""}). The exact texture, color, and pattern MUST be sampled from the swatch image — do not interpret loosely.`;

  const lines = [
    `${label}: ✅ APPLY Cover Styl' ref. ${el.ref} — "${el.name}"`,
    `  ${colorEmphasis}`,
    el.tags?.length ? `  Visual traits: ${el.tags.join(", ")}` : null,
    imageIndex !== null
      ? `  🎨 SWATCH IMAGE ${imageIndex + 2}: This is the precise color/texture reference for ref. ${el.ref} "${el.name}". Sample colors PIXEL-DIRECTLY from this swatch — same hue, same saturation, same value, same brightness. ${isSolidColor ? "For solid colors: pick a single representative pixel from the center of the swatch and apply that exact RGB color uniformly across the surface." : "Replicate grain/veining/pattern at a realistic scale (wood ~15-20cm planks, marble veins large-scale)."}${el.finition ? ` Surface finish: ${el.finition} (${el.finition.toLowerCase().includes("gloss") ? "reflective with specular highlights" : el.finition.toLowerCase().includes("matt") ? "matte, no specular" : "natural light absorption matching the swatch"}).` : ""}`
      : `  ⚠️ NO SWATCH PROVIDED — base the texture purely on the name "${el.name}" and visual traits.`,
  ].filter(Boolean);

  return lines.join("\n");
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

    const elementDescriptions = ["zone1", "zone2", "zone3"]
      .map((zk) => describeElement(
        `${zoneLabels[zk].toUpperCase()}`,
        elements[zk],
        imageIndexMap[zk]
      ))
      .join("\n\n");

    // Contexte du type de projet pour le prompt — source unique : src/app/simulation/projects.ts
    const projectType = body.project_type || "cuisine";
    const project: ProjectType = getProject(projectType);

    // Liste explicite des éléments à NE JAMAIS toucher (varie par projet : cuisine ≠ SDB ≠ dressing)
    const keepUntouchedList = project.promptKeepUntouched
      .map((item) => `- ${item}`)
      .join("\n");

    const imagePrompt = `You are a professional interior renovation visualizer for CoverSwap, a company that applies Cover Styl' adhesive vinyl films on ${project.promptSurfaceContext}.

YOUR MISSION: Take IMAGE 1 (the client's real ${project.promptRoomType} photo) and produce an output image where ONLY the specified surfaces have their material/texture replaced. Everything else stays PERFECTLY identical.

${textureEntries.length > 0 ? `TEXTURE REFERENCES: Images ${textureEntries.map((_, i) => i + 2).join(", ")} are close-up swatches of Cover Styl' adhesive film materials. Each shows the exact color, grain, veining, and finish of the vinyl to apply.` : ""}

═══════════════════════════════════════
SURFACE INSTRUCTIONS (read each carefully):
═══════════════════════════════════════

${elementDescriptions}

═══════════════════════════════════════
CRITICAL RULES — NON-NEGOTIABLE:
═══════════════════════════════════════

🔒 RULE 1 — EXACT SAME PHOTOGRAPH:
The output MUST be the exact same photograph as IMAGE 1. Think of it as a "find and replace" on specific surfaces only.
- SAME camera angle, focal length, and field of view — NO zoom in, NO zoom out, NO crop, NO reframing
- SAME image dimensions and aspect ratio as the input
- The edges/borders of the output image must show the exact same content as the input
- If the original photo shows a wall on the left edge, the output must show that same wall at the same position

🔒 RULE 2 — ABSOLUTE STRUCTURAL PRESERVATION (project: ${project.label}):
Every non-targeted element must remain pixel-identical. For this ${project.promptRoomType}, the following MUST stay 100% identical to IMAGE 1:
${keepUntouchedList}

🔒 RULE 3 — TEXTURE APPLICATION QUALITY (READ CAREFULLY):
For surfaces marked with ✅:
- 🎯 COLOR FIDELITY IS NON-NEGOTIABLE: sample the color DIRECTLY from the swatch image (same RGB pixel values). Do NOT shift hue, saturation, value, or brightness — even slightly. If the swatch shows pure black, the output must be pure black. If the swatch shows pale blue, the output must be that exact pale blue — not a "similar blue".
- 🎯 SOLID COLORS are uniform — no wood grain, no marble veining, no patterns. They are flat, even tones across the entire surface (only natural light/shadow variations from the original photo's lighting).
- 🎯 NAMED COLORS: when the surface name is "Lacquered Black", "Sun Flower Yellow", "Midnight Blue" etc., the output color MUST clearly read as that name to a human observer. Do not desaturate or mute named colors.
- Pattern: for textured materials (wood, marble, stone), replicate the grain/veining direction naturally. Wood grain should run horizontally on countertops and vertically on cabinet fronts (unless the swatch suggests otherwise)
- Scale: the pattern must be proportionally realistic — marble veining should be large-scale, wood grain should match real plank widths (~15-20cm)
- 3D wrapping: the texture must follow the surface geometry — wrap around cabinet edges, follow countertop corners
- Finish: if the swatch is matte, the surface should absorb light. If glossy, add subtle specular highlights consistent with the existing light sources

🔒 RULE 4 — LIGHTING CONTINUITY:
- Preserve the EXACT same light sources, directions, color temperature
- Shadows remain in the same positions with the same softness
- Only adjust reflections/specular to match the new material properties (e.g., matte marble reflects less than glossy marble)
- Ambient occlusion in corners and under cabinets stays identical

🔒 RULE 5 — SURFACES MARKED ⛔:
Any surface marked "DO NOT TOUCH" must be reproduced with zero visual difference from the original. Not even a subtle color shift.

🔒 RULE 6 — PHOTOREALISM:
- The output must look like a real photograph taken by a phone camera, NOT a CGI render
- Maintain the same image noise/grain level as the original
- Maintain natural lens characteristics (slight vignetting, depth of field) if present in the original
- No artificial HDR look, no over-saturation, no artificial sharpening

🔒 RULE 7 — ${project.label.toUpperCase()}-SPECIFIC RULES:
${project.promptSpecificRules}

OUTPUT: One photorealistic image of this exact ${project.promptRoomType} with ONLY the specified surfaces changed to Cover Styl' materials. Every element listed in RULE 2 must remain pixel-identical.`;

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

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", imagePrompt);
    formData.append("size", outputSize);
    // quality "low" : ~15-25s typique (vs ~30-40s en medium). Garantit qu'on
    // tient confortablement dans Vercel maxDuration=60s même avec photos
    // complexes. La fidélité couleur est préservée par le prompt strict.
    formData.append("quality", "low");

    formData.append("image[]", new Blob([new Uint8Array(kitchenBuffer)], { type: "image/png" }), "kitchen.png");
    for (const entry of textureEntries) {
      formData.append("image[]", new Blob([new Uint8Array(entry.buffer)], { type: "image/jpeg" }), `texture_${entry.key}.jpg`);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[simulation] Sending ${1 + textureEntries.length} images to gpt-image-1 quality=low (prompt ${imagePrompt.length} chars)`);
    }

    /* AbortController pour timeout propre AVANT que Vercel kill la fonction. */
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    let imageRes: Response;
    try {
      imageRes = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isAbort = fetchErr instanceof Error && (fetchErr.name === "AbortError" || /aborted/i.test(fetchErr.message));
      if (isAbort) {
        console.error("[simulation] OpenAI timeout après", OPENAI_TIMEOUT_MS, "ms");
        return NextResponse.json(
          {
            error: "La génération a pris trop de temps. Essayez avec une photo plus simple ou moins de zones à modifier.",
            reason: "openai-timeout",
          },
          { status: 504, headers: rateLimitHeaders(rl) }
        );
      }
      console.error("[simulation] OpenAI fetch error:", fetchErr);
      return NextResponse.json(
        { error: "Service de génération d'image indisponible. Réessayez dans un instant.", reason: "openai-network" },
        { status: 502, headers: rateLimitHeaders(rl) }
      );
    }
    clearTimeout(timeoutId);

    if (!imageRes.ok) {
      const err = await imageRes.text().catch(() => "");
      console.error(`[simulation] OpenAI HTTP ${imageRes.status}:`, err.slice(0, 500));
      const userMessage =
        imageRes.status === 429
          ? "Trop de requêtes vers le service IA. Réessayez dans une minute."
          : imageRes.status === 400
          ? "L'IA a refusé cette photo (probablement trop sombre, floue ou non conforme). Essayez une autre photo bien éclairée."
          : "Erreur lors de la génération de l'image. Réessayez ou contactez-nous.";
      return NextResponse.json(
        { error: userMessage, reason: "openai-error", status: imageRes.status },
        { status: 502, headers: rateLimitHeaders(rl) }
      );
    }

    const imageData = await imageRes.json();
    const generatedB64 = imageData.data?.[0]?.b64_json;

    if (!generatedB64) {
      console.error("[simulation] Réponse OpenAI sans b64_json:", JSON.stringify(imageData).slice(0, 500));
      return NextResponse.json(
        { error: "Aucune image générée. Réessayez.", reason: "no-image-data" },
        { status: 502, headers: rateLimitHeaders(rl) }
      );
    }

    const resultImage = `data:image/png;base64,${generatedB64}`;

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
