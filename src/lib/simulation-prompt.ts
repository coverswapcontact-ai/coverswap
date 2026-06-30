/**
 * Construction du prompt de simulation gpt-image-1 — SOURCE UNIQUE.
 *
 * Utilisé par :
 *  - /api/simulation        (chemin synchrone Vercel, fallback)
 *  - /api/simulation/prepare (chemin Railway : prépare le prompt, Railway exécute)
 *
 * ⚠️ Toute modification du prompt se fait ICI et nulle part ailleurs, pour
 * garantir une fidélité de rendu identique quel que soit le chemin d'exécution.
 */

import type { ProjectType } from "@/app/simulation/projects";

export interface ElementInfo {
  ref: string;
  name: string;
  famille: string;
  finition?: string;
  categorie?: string;
  tags?: string[];
  imageUrl?: string;
}

/* ──────────────────────────────────────────────────────────────────
   DESCRIPTION D'UN ÉLÉMENT (zone) pour le prompt.
   Enforce strict pour la fidélité couleur (bug fréquent gpt-image-1 qui
   "interprète" librement les swatches couleur unie).
────────────────────────────────────────────────────────────────── */
export function describeElement(
  label: string,
  el: ElementInfo | null,
  imageIndex: number | null
): string {
  if (!el || !el.ref) {
    return `${label}: ⛔ DO NOT TOUCH. This surface MUST remain 100% pixel-identical to the original photo. No color shift, no texture change, no alteration whatsoever.`;
  }

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
   PROMPT COMPLET gpt-image-1
────────────────────────────────────────────────────────────────── */
export function buildImagePrompt(params: {
  project: ProjectType;
  zoneLabels: Record<string, string>;
  elements: Record<string, ElementInfo | null>;
  imageIndexMap: Record<string, number | null>;
  swatchCount: number;
}): string {
  const { project, zoneLabels, elements, imageIndexMap, swatchCount } = params;

  const elementDescriptions = ["zone1", "zone2", "zone3"]
    .map((zk) =>
      describeElement(`${zoneLabels[zk]?.toUpperCase() || zk.toUpperCase()}`, elements[zk], imageIndexMap[zk])
    )
    .join("\n\n");

  const keepUntouchedList = project.promptKeepUntouched.map((item) => `- ${item}`).join("\n");

  const swatchIndices = Array.from({ length: swatchCount }, (_, i) => i + 2).join(", ");

  return `You are a professional interior renovation visualizer for CoverSwap, a company that applies Cover Styl' adhesive vinyl films on ${project.promptSurfaceContext}.

YOUR MISSION: Take IMAGE 1 (the client's real ${project.promptRoomType} photo) and produce an output image where ONLY the specified surfaces have their material/texture replaced. Everything else stays PERFECTLY identical.

${swatchCount > 0 ? `TEXTURE REFERENCES: Images ${swatchIndices} are close-up swatches of Cover Styl' adhesive film materials. Each shows the exact color, grain, veining, and finish of the vinyl to apply.` : ""}

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
}
