/**
 * Construction de la consigne envoyée au modèle d'image — SOURCE UNIQUE.
 *
 * Utilisée par :
 *  - /api/simulation/prepare (chemin normal : le site prépare et signe, le CRM génère)
 *  - /api/simulation         (repli synchrone sur Vercel)
 *
 * Trois étages :
 *  1. la surface (lib/simulateur/surfaces) : ce qui reçoit le film, où il
 *     s'arrête, ce qui ne bouge jamais autour, comment il se pose ;
 *  2. le revêtement (ci-dessous) : un bois veiné, un uni mat, un marbre, un
 *     métal brossé ne se décrivent pas de la même façon ;
 *  3. la scène : tout ce qui n'est pas une surface visée est verrouillé, et la
 *     consigne se termine par un contrôle que le modèle doit faire lui-même.
 *
 * Le principe est celui du chantier : on pose un film adhésif sur une forme
 * imposée. Le rendu doit être superposable à la photo hors surfaces visées.
 * Toute modification de consigne se fait ICI et dans surfaces.ts, nulle part ailleurs.
 */

import type { ProjectType } from "@/lib/simulateur/projets";
import type { SensVeinage, Surface } from "@/lib/simulateur/surfaces";

export interface ElementInfo {
  ref: string;
  name: string;
  famille: string;
  finition?: string;
  categorie?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface SurfaceChoisie {
  surface: Surface;
  revetement: ElementInfo;
  /** Rang de l'échantillon parmi les images jointes (0 = première image après la photo). */
  indexEchantillon: number;
}

/* ──────────────────────────────────────────────────────────────────
   Le revêtement : de quoi est fait le décor, comment il prend la lumière
────────────────────────────────────────────────────────────────── */
type Profil = "uni-mat" | "uni-brillant" | "uni-raye" | "bois" | "bois-peint" | "marbre" | "pierre" | "terrazzo" | "beton" | "brique" | "metal-brosse" | "metal-poli" | "metal-patine" | "cuir" | "tissu" | "paillettes";

const contient = (texte: string, mots: string[]) => mots.some((m) => texte.includes(m));

export function profilRevetement(el: ElementInfo): Profil {
  const nom = ` ${el.name} ${(el.tags ?? []).join(" ")} ${el.categorie ?? ""} `.toLowerCase();
  switch (el.famille) {
    case "couleur":
      if (contient(nom, ["stripe"])) return "uni-raye";
      return contient(nom, ["lacquer", "gloss", "shiny", "brillant"]) ? "uni-brillant" : "uni-mat";
    case "bois":
      return contient(nom, ["painted", "peint", "plain white", "turquoise", "dark blue"]) ? "bois-peint" : "bois";
    case "pierre":
      if (contient(nom, ["terrazzo", "multicolored", "spotted"])) return "terrazzo";
      if (contient(nom, ["marble", "marquina", "statuary", "onyx", "arabesque", "armani", "lombarda", "crema", "polished", "imperial", "opal", "calacatta", "carrara"])) return "marbre";
      return "pierre";
    case "beton":
      return contient(nom, ["brick"]) ? "brique" : "beton";
    case "metal":
      if (contient(nom, ["chrom", "glow", "aurora", "laser"])) return "metal-poli";
      if (contient(nom, ["patina", "corten", "antique", "iron", "copper", "bronze", "roseate"])) return "metal-patine";
      return "metal-brosse";
    case "textile":
      return (el.tags ?? []).includes("cuir") || contient(nom, ["leather"]) ? "cuir" : "tissu";
    case "paillettes":
      return "paillettes";
    default:
      return "uni-mat";
  }
}

const SENS: Record<SensVeinage, string> = {
  vertical: "vertically (bottom to top) on this surface",
  horizontal: "horizontally (left to right) on this surface",
  longueur: "along the longest dimension of this surface",
  libre: "in the direction shown by the sample",
};

/** Description du film à poser : matière, échelle du décor, sens, comportement à la lumière. */
export function decrireRevetement(el: ElementInfo, sens: SensVeinage, image: number): string[] {
  const direction = SENS[sens];
  switch (profilRevetement(el)) {
    case "uni-mat":
      return [
        `Solid colour, matt to soft-satin film. It has NO pattern: no grain, no veining, no speckle, no brush marks, no gradient of its own.`,
        `Colour: take it from the centre of IMAGE ${image} and keep that exact hue, saturation and lightness as the base colour of the whole surface. The name "${el.name}" must read true to a human eye. Do not drift toward the room's white balance: warm bulbs must not turn a white film cream, daylight must not turn it bluish; do not mute, pastel, darken or "harmonise" the colour with the room.`,
        `Light: a matt film diffuses light — broad, soft luminance gradients only, no mirror-like reflection, no hotspot. All shading on the surface comes from the light already in IMAGE 1 (same shadows, same gradients), multiplied over the flat base colour.`,
      ];
    case "uni-brillant":
      return [
        `Solid colour, high-gloss lacquer-look film. It has NO pattern of its own: a perfectly uniform colour under a glossy clear surface.`,
        `Colour: exact hue, saturation and lightness of the centre of IMAGE ${image}; the name "${el.name}" must read true. No drift toward the room's white balance, no muting.`,
        `Light: gloss means soft mirror-like reflections — but ONLY of what already exists in IMAGE 1 (windows, lamps, the opposite worktop or floor), placed where the geometry puts them, slightly blurred. Do not invent a window, a lamp or a studio highlight. Deep colours stay deep: reflections sit on top, the base colour does not turn grey.`,
      ];
    case "uni-raye":
      return [
        `Solid colour film with fine, regular, embossed parallel stripes (tone on tone), as in IMAGE ${image}.`,
        `Colour: exact base colour of IMAGE ${image}, no drift toward the room's white balance. Stripes: thin, evenly spaced, perfectly parallel, running ${direction}; keep the real scale of the sample (a stripe every few millimetres — from a distance they read as a fine texture, not as bold bands).`,
        `Light: matt; the stripes only catch a faint directional sheen.`,
      ];
    case "bois":
      return [
        `Wood-grain decor film "${el.name}": reproduce the species look of IMAGE ${image} — its base tone, the contrast of its grain lines, its knots or absence of knots, its cathedral or straight-grain figure.`,
        `Grain runs ${direction}, continuous over the full length of each panel. Scale: true to life — the sample is a close-up of the film; at room distance grain lines are a few millimetres to a few centimetres apart, never enlarged into giant stripes nor shrunk into noise. Do not mirror or tile the sample visibly: no repeated knot at regular intervals. Each door or panel is cut from a different part of the roll, so neighbouring panels look alike but not identical.`,
        `Colour: keep the exact wood tone of the sample (do not redden, yellow, grey or darken it to suit the room). Light: satin-matt film with a fine wood-pore emboss — soft broad highlights, no varnish glare, no plastic shine.`,
      ];
    case "bois-peint":
      return [
        `Painted-wood decor film "${el.name}": an opaque colour through which a fine wood grain remains visible as subtle tone-on-tone lines, as in IMAGE ${image}.`,
        `Grain lines run ${direction}, fine and low-contrast, true to life in scale (the sample is a close-up of the film). The colour is the exact colour of IMAGE ${image}: no drift toward the room's white balance, no muting.`,
        `Light: matt; the grain only shows as a faint texture in grazing light.`,
      ];
    case "marbre":
      return [
        `Marble decor film "${el.name}": reproduce the stone of IMAGE ${image} — its ground colour, the colour, thickness and softness of its veins, the density of veining (sparse or busy) exactly as the sample shows.`,
        `Veins: irregular, organic, branching, never parallel stripes, never a regular lattice; they flow diagonally or ${direction} and continue without a break across the whole panel, then restart on the next separate panel. Scale: large and true to life — the sample is a close-up; a main vein may cross a whole door or a metre of worktop. No visible repetition of the same vein motif, no mirrored "butterfly" pattern.`,
        `Colour: keep the ground colour exact (a white marble stays neutral white, not cream; a Nero stays deep black with crisp veins). Light: honed-satin stone look — smooth, soft broad reflections of the light sources already present in IMAGE 1, no invented glare, no wet look.`,
      ];
    case "pierre":
      return [
        `Natural-stone decor film "${el.name}" (travertine, slate, basalt, granite type): reproduce the mineral structure of IMAGE ${image} — its ground colour, its fine grain, pits, clouds or soft layered bands.`,
        `Structure: fine and irregular, spread evenly, with any layering running ${direction}; true to life in scale (the sample is a close-up of the film). No marble-like veins unless the sample shows them, no tile joints, no repetition.`,
        `Colour: exact tone of the sample, no drift toward the room's white balance. Light: matt mineral surface, soft diffuse shading, no gloss.`,
      ];
    case "terrazzo":
      return [
        `Terrazzo / speckled-stone decor film "${el.name}": a ground colour scattered with stone chips, as in IMAGE ${image}.`,
        `Chips: irregular in shape and size, randomly scattered with no alignment and no repetition, in the colours and density of the sample; true scale (the sample is a close-up: chips measure millimetres to a few centimetres, not more).`,
        `Colour: exact ground and chip colours. Light: smooth satin-matt surface, soft reflections only of what exists in IMAGE 1.`,
      ];
    case "beton":
      return [
        `Concrete / cement / stucco decor film "${el.name}": reproduce the mineral, cloudy surface of IMAGE ${image} — soft tonal clouds, trowel movements, fine pores.`,
        `Structure: large, soft, irregular mottling with no direction and no repetition; no formwork joints, no cracks, no stains and no tile grid unless the sample shows them. True to life in scale: the sample is a close-up of the film.`,
        `Colour: exact grey/taupe/earth tone of the sample, no drift. Light: dead-matt, fully diffuse — no reflection at all, only the shading already present in IMAGE 1.`,
      ];
    case "brique":
      return [
        `Brick decor film "${el.name}": courses of bricks with mortar joints as in IMAGE ${image}, printed on a flat film.`,
        `Courses are perfectly horizontal, in running bond, at true scale (a brick is about 22 cm long and 6 cm high); they follow the perspective of the surface. The surface stays FLAT: the relief is printed, the outline of the surface does not become jagged.`,
        `Colour: exact brick and mortar tones of the sample. Light: matt.`,
      ];
    case "metal-brosse":
      return [
        `Brushed-metal decor film "${el.name}": reproduce the metal tone of IMAGE ${image} with its fine, straight brushing lines (or its embossed stripe or dot pattern if the sample shows one, at true scale).`,
        `Brushing runs ${direction}, perfectly straight and parallel, hair-fine. Colour: exact metal tone of the sample (silver stays neutral, gold stays the sample's gold, graphite stays dark).`,
        `Light: anisotropic metallic sheen — highlights stretch perpendicular to the brushing as soft bands; they come only from light sources already present in IMAGE 1. No mirror reflection, no chrome effect, no invented studio light.`,
      ];
    case "metal-poli":
      return [
        `Polished / iridescent metallic film "${el.name}" as shown in IMAGE ${image}.`,
        `Colour and effect: exact tone and shimmer of the sample. Any stripe pattern runs ${direction} at true scale.`,
        `Light: strongly reflective, but it reflects ONLY the existing scene of IMAGE 1, blurred and plausible for the geometry. Do not invent objects, windows or lamps in the reflection.`,
      ];
    case "metal-patine":
      return [
        `Patinated / oxidised metal decor film "${el.name}" (copper, bronze, corten, blackened iron type): reproduce the clouded, uneven patina of IMAGE ${image}.`,
        `Structure: irregular clouds and stains of oxidation, no direction, no repetition, true to life in scale (the sample is a close-up). Colour: exact tones of the sample.`,
        `Light: low satin metallic sheen, soft and uneven, only from the light already in IMAGE 1. No mirror reflection.`,
      ];
    case "cuir":
      return [
        `Leather-look decor film "${el.name}": reproduce the fine leather grain of IMAGE ${image} and its exact colour.`,
        `Grain: tiny, irregular, uniform over the surface — at room distance it reads as an almost plain, slightly soft surface. No seams, no stitching, no quilting, no upholstery buttons: it is a flat film, not padded leather.`,
        `Colour: exact colour of the sample, no drift. Light: soft satin sheen with gentle, broad highlights.`,
      ];
    case "tissu":
      return [
        `Textile-look decor film "${el.name}" (linen, weave, mesh, chevron type): reproduce the woven structure and colour of IMAGE ${image}.`,
        `Weave: fine and regular, threads running ${direction} and across; true scale (threads are about a millimetre — at room distance the surface reads as a soft, slightly heathered plain, with the weave visible only up close). Metallic threads, if the sample has them, glint faintly. No folds, no drape, no seams: a flat film.`,
        `Colour: exact tones of the sample. Light: matt, fully diffuse.`,
      ];
    case "paillettes":
      return [
        `Glitter decor film "${el.name}": a coloured ground densely covered with tiny reflective flakes, as in IMAGE ${image}.`,
        `Flakes: minute (about a millimetre), random, evenly dense; they sparkle as tiny points of light, more where the existing light of IMAGE 1 hits the surface. No large sequins, no stars, no pattern.`,
        `Colour: exact ground colour of the sample. Light: glossy ground with point sparkles; no invented spotlight.`,
      ];
  }
}

/* ──────────────────────────────────────────────────────────────────
   La consigne complète
────────────────────────────────────────────────────────────────── */
function blocSurface(choix: SurfaceChoisie, rang: number): string {
  const { surface, revetement } = choix;
  const image = choix.indexEchantillon + 2;
  const p = surface.prompt;
  return [
    `TARGET ${rang} — ${p.nom}`,
    `Film: Cover Styl' ref. ${revetement.ref} "${revetement.name}" — flat sample in IMAGE ${image}.`,
    `Receives the film: ${p.cible}`,
    `Where the film stops: ${p.limites}`,
    `Touching or standing on this surface, NEVER changed: ${p.exclus}`,
    `How the film is laid: ${p.pose}`,
    `The film itself:`,
    ...decrireRevetement(revetement, p.sens, image).map((l) => `  - ${l}`),
    `Coverage: every instance of this surface visible in IMAGE 1 receives the film, entirely, up to its limits — including instances partly hidden or cut by the frame. If IMAGE 1 shows no such surface, change nothing for this target: never build one.`,
  ].join("\n");
}

export function buildImagePrompt(params: { project: ProjectType; choix: SurfaceChoisie[] }): string {
  const { project, choix } = params;
  const nbImages = choix.reduce((max, c) => Math.max(max, c.indexEchantillon + 2), 1);
  const echantillons = nbImages > 2 ? `IMAGES 2 to ${nbImages} are` : "IMAGE 2 is";
  const cibles = choix.map((c, i) => blocSurface(c, i + 1)).join("\n\n");
  const verrous = project.promptKeepUntouched.map((l) => `- ${l}`).join("\n");
  const controles = choix.map((c, i) => `- Target ${i + 1}: ${c.surface.prompt.controle}`).join("\n");

  return `TASK: TEXTURE REPLACEMENT ON A REAL PHOTOGRAPH. This is an edit of IMAGE 1, not a new image, not a redesign, not a 3D render.

IMAGE 1 is a real photograph of a ${project.promptRoomType}, taken by a client with a phone. ${echantillons} flat, front-lit sample(s) of Cover Styl' adhesive decor film: they show a material, not a scene — never copy their framing, borders, labels or lighting into the result.

THE REAL-WORLD OPERATION YOU ARE SIMULATING
An installer lays a 0.2 mm adhesive film onto existing surfaces. The film takes the shape it is laid on. It adds no thickness, moves nothing, removes nothing, repairs nothing and lights nothing. After the job, the room is the same room, photographed from the same spot at the same second: only the skin of the target surfaces is different. Produce exactly that photograph.

═══ TARGET SURFACES (the ONLY things that change) ═══

${cibles}

═══ LOCKED — everything that is not a target surface ═══
Treat the target surfaces as a mask. Outside that mask, the result must be superimposable on IMAGE 1: if both images were stacked and flipped back and forth, nothing outside the target surfaces would move, appear, disappear or change colour.
- Framing: same camera position, angle, focal length, perspective lines, horizon tilt and lens distortion. Same aspect ratio. No crop, no zoom, no straightening, no widening. The four borders of the frame show exactly the same content.
- Geometry: every piece of furniture keeps its position, size, proportions, number of doors, drawers and panels, the width of every gap, every edge profile, every relief. Layout unchanged.
- Hardware and equipment: handles, knobs, hinges, rails, taps, sinks, appliances, sockets, switches, lights — same model, same finish, same place.
- Objects and living things: every object present in IMAGE 1 stays, at the same place, same size, same orientation, same colour, including clutter, cables, stains, dishes, laundry, reflections of objects, people, pets and plants. An object in front of a target surface stays in front of it, complete, with its contact shadow; the film passes behind it.
- Light: same light sources, same direction, same colour temperature, same exposure, same white balance. Every cast shadow, contact shadow, ambient-occlusion line, light pool and gradient stays at the same place with the same softness. On a target surface, the ORIGINAL pattern of light and shadow is kept and simply falls on the new material; only the way the material answers light (matt, satin, gloss, metallic) adapts, as described per film.
- Reflections: mirrors, glass, screens, glossy floors and chrome keep their reflections; a target surface seen in a reflection changes there too, and nothing else in the reflection changes.
- Photographic character: same sharpness, same depth of field, same blur where IMAGE 1 is blurred, same noise/grain, same compression softness, same vignetting. It must look like the same phone took it. No HDR look, no added sharpening, no extra saturation or contrast.
Specific to this ${project.promptRoomType}:
${verrous}
${project.promptSpecificRules}

═══ FORBIDDEN ═══
- Do NOT add anything: no object, plant, decoration, appliance, handle, light, window, shelf, tile, plinth or person that is not in IMAGE 1.
- The objects and fittings named in this brief are examples of what MAY be present; they do not describe IMAGE 1. Never draw an item because it is named here: only what IMAGE 1 actually shows exists.
- Do NOT remove anything: no object, cable, stain, magnet, sticker or mark disappears.
- Do NOT tidy, clean, declutter, straighten, align, centre or re-arrange anything.
- Do NOT embellish: no staging, no upgrade of appliances or taps, no nicer floor or wall, no better light, no renovation of anything that is not a target surface.
- Do NOT complete or reinterpret unclear areas: where IMAGE 1 is blurry, dark, overexposed, cropped or hidden, reproduce that area exactly as unclear as it is. Never guess what is behind an object or beyond the frame, never sharpen a blurred zone into invented detail.
- Do NOT change the shape of a target surface to suit the material: no new edge profile, no added thickness, no new joints, no removed grooves, no extra panels.
- Do NOT spread the film beyond the listed limits, and do NOT let its colour bleed or tint neighbouring surfaces.
- Do NOT put text, logos, watermarks, borders or sample labels in the image.

═══ FINAL CHECK — do this before you output ═══
Compare your result with IMAGE 1, point by point, and correct any difference before producing the image:
1. Overlay: outside the target surfaces, would the two images superimpose exactly — same edges, same objects, same borders of the frame?
2. Counts: same number of doors, drawers, handles, sockets, appliances and objects as in IMAGE 1.
3. Coverage: every instance of each target surface is fully covered up to its limits; no patch of the old material is left; nothing beyond the limits has been covered.
4. Material: placed next to its sample, each film shows the same colour (hue, saturation, lightness), the same decor and a true-to-life scale and direction.
5. Light: shadows, gradients and highlights on the target surfaces are where they were in IMAGE 1.
6. Nothing added, removed, tidied, embellished or invented.
${controles}

OUTPUT: one photorealistic image — IMAGE 1 itself, with only the target surfaces wearing their new film.`;
}
