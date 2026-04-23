import { NextRequest, NextResponse } from "next/server";
import { sendLeadToCRM, splitName, type CrmTypeProjet } from "@/lib/crm";
import { checkSimulationRateLimit } from "@/lib/rate-limit";

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
────────────────────────────────────────────────────────────────── */
function describeElement(label: string, el: ElementInfo | null, imageIndex: number | null): string {
  if (!el || !el.ref) {
    return `${label}: ⛔ DO NOT TOUCH. This surface MUST remain 100% pixel-identical to the original photo. No color shift, no texture change, no alteration whatsoever.`;
  }

  const lines = [
    `${label}: ✅ APPLY new texture — Cover Styl' ref. ${el.ref} "${el.name}"`,
    el.famille ? `  Material family: ${el.famille}` : null,
    el.finition ? `  Surface finish: ${el.finition}` : null,
    el.categorie ? `  Category: ${el.categorie}` : null,
    el.tags?.length ? `  Visual traits: ${el.tags.join(", ")}` : null,
    imageIndex !== null
      ? `  🎨 TEXTURE REFERENCE: See IMAGE ${imageIndex + 2}. This is a close-up swatch of the exact adhesive film. You MUST replicate this precise color, grain pattern, veining, and surface finish on the specified surface. Scale the pattern realistically to the surface dimensions.`
      : null,
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
    ══════════════════════════════════════════════════════════════ */
    const textureEntries: { key: string; el: ElementInfo; buffer: Buffer }[] = [];
    const downloadPromises: Promise<void>[] = [];

    for (const [key, el] of Object.entries(elements)) {
      if (el?.imageUrl) {
        downloadPromises.push(
          downloadImage(el.imageUrl).then((buf) => {
            if (buf) textureEntries.push({ key, el, buffer: buf });
          })
        );
      }
    }
    await Promise.all(downloadPromises);

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

    // Contexte du type de projet pour le prompt
    const projectType = body.project_type || "cuisine";
    const PROJECT_PROMPT_MAP: Record<string, { room: string; surfaces: string }> = {
      cuisine: { room: "kitchen", surfaces: "kitchen surfaces — backsplash, countertops, and cabinet doors" },
      "salle-de-bain": { room: "bathroom", surfaces: "bathroom surfaces — vanity cabinet, wall tiles, and shower/bathtub surround" },
      meubles: { room: "furniture/closet", surfaces: "furniture surfaces — door fronts, shelves/top, and side panels" },
      "mur-plafond": { room: "room (walls and ceiling)", surfaces: "wall and ceiling surfaces — main wall, accent wall, and ceiling" },
      professionnel: { room: "professional workspace", surfaces: "workspace surfaces — desk/counter, storage fronts, and wall cladding" },
    };
    const ctx = PROJECT_PROMPT_MAP[projectType] || PROJECT_PROMPT_MAP.cuisine;

    const imagePrompt = `You are a professional interior renovation visualizer for CoverSwap, a company that applies Cover Styl' adhesive vinyl films on ${ctx.surfaces}.

YOUR MISSION: Take IMAGE 1 (the client's real ${ctx.room} photo) and produce an output image where ONLY the specified surfaces have their material/texture replaced. Everything else stays PERFECTLY identical.

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

🔒 RULE 2 — ABSOLUTE STRUCTURAL PRESERVATION:
Every non-targeted element must remain pixel-identical:
- Cabinet doors: same number, same sizes, same positions, same gaps between them
- Handles, knobs, hinges: same style, same metal finish, same exact placement
- Appliances: oven, hood, fridge, microwave, dishwasher — completely untouched
- Sink, faucet, taps — completely untouched
- Electrical outlets, switches, lights — completely untouched
- Objects on countertops: bottles, jars, utensils, plants, cutting boards — all stay exactly as they are
- Floor, ceiling, walls (non-backsplash) — completely untouched
- Windows, curtains, blinds — completely untouched
- Furniture visible in the background — completely untouched

🔒 RULE 3 — TEXTURE APPLICATION QUALITY:
For surfaces marked with ✅:
- Color: match the EXACT hue, saturation, and value from the texture swatch
- Pattern: replicate the grain/veining direction naturally. Wood grain should run horizontally on countertops and vertically on cabinet fronts (unless the swatch suggests otherwise)
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

OUTPUT: One photorealistic image of this exact ${ctx.room} with only the specified surfaces changed to Cover Styl' materials.`;

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
    formData.append("quality", "high");

    // Image 1: Kitchen photo (the source)
    formData.append("image[]", new Blob([new Uint8Array(kitchenBuffer)], { type: "image/png" }), "kitchen.png");

    // Images 2+: Texture reference samples
    for (const entry of textureEntries) {
      formData.append("image[]", new Blob([new Uint8Array(entry.buffer)], { type: "image/jpeg" }), `texture_${entry.key}.jpg`);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[simulation] Sending ${1 + textureEntries.length} images to gpt-image-1 (prompt ${imagePrompt.length} chars)`);
    }

    const imageRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!imageRes.ok) {
      const err = await imageRes.text();
      console.error("Image edit error:", err);
      return NextResponse.json({ error: "Erreur lors de la génération de l'image." }, { status: 502 });
    }

    const imageData = await imageRes.json();
    const generatedB64 = imageData.data?.[0]?.b64_json;

    if (!generatedB64) {
      return NextResponse.json({ error: "Aucune image générée." }, { status: 502 });
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
