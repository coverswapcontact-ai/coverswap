/**
 * Configuration des types de projets pour le simulateur multi-projet.
 *
 * Chaque projet définit :
 *  - ses zones modifiables (éléments)
 *  - le contexte pour le prompt IA
 *  - les labels UX
 *  - le mapping CRM
 */

export interface ProjectElement {
  key: string;
  label: string;
  description: string;
}

export interface ProjectType {
  id: string;
  label: string;
  icon: string;                // emoji ou lucide icon name
  description: string;
  uploadHint: string;          // texte affiché à l'étape upload
  uploadTip: string;           // conseil photo
  elements: ProjectElement[];
  /* ── Champs prompt IA (importés serveur-side dans /api/simulation) ── */
  promptRoomType: string;          // "kitchen" | "bathroom" | etc. pour le prompt IA
  promptSurfaceContext: string;    // description des surfaces pour guider l'IA
  promptKeepUntouched: string[];   // liste explicite de ce qui ne doit JAMAIS bouger
  promptSpecificRules: string;     // règles spécifiques au projet (mirroirs, électroménager, etc.)
  crmTypeProjet: string;           // CUISINE | SDB | MEUBLES | PRO | AUTRE
}

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: "cuisine",
    label: "Cuisine",
    icon: "🍳",
    description: "Crédence, plan de travail, façades",
    uploadHint: "Votre photo de cuisine",
    uploadTip: "Prenez la photo de face, bien éclairée, cadrant l'ensemble de la cuisine",
    elements: [
      { key: "zone1", label: "Crédence", description: "Le mur entre le plan de travail et les meubles hauts" },
      { key: "zone2", label: "Plan de travail", description: "La surface horizontale de travail" },
      { key: "zone3", label: "Façades", description: "Les portes et tiroirs de vos meubles" },
    ],
    promptRoomType: "kitchen",
    promptSurfaceContext: "kitchen surfaces — backsplash/splashback (crédence), countertops/worktops, and cabinet doors/drawer fronts (façades)",
    promptKeepUntouched: [
      "Appliances: oven, hood/range hood, refrigerator, microwave, dishwasher, coffee machine — completely untouched",
      "Sink, faucet/tap, soap dispenser — completely untouched (the sink bowl itself never changes color)",
      "Cabinet structure: same exact number of doors/drawers, same sizes, same positions, same gaps between them",
      "Handles, knobs, hinges: same style, same metal finish, same exact placement — never replaced or moved",
      "Electrical outlets, switches, light fixtures, under-cabinet LEDs — completely untouched",
      "Objects on countertops: bottles, jars, utensils, plants, cutting boards, dishes, kettle, toaster — all stay exactly as photographed",
      "Floor, ceiling, walls outside the backsplash zone — completely untouched",
      "Windows, curtains, blinds, window frames — completely untouched",
      "Furniture and decorative items in the background — completely untouched",
    ],
    promptSpecificRules:
      "Treat this as a 'find and replace' on the targeted kitchen surfaces only. Cabinet panels keep their exact original layout. Countertop edge profile (rounded vs. squared) stays the same. The backsplash extends ONLY between countertop and wall cabinets — never onto adjacent walls. If only the backsplash is selected, the cabinets and worktop must remain pixel-identical.",
    crmTypeProjet: "CUISINE",
  },
  {
    id: "salle-de-bain",
    label: "Salle de bain",
    icon: "🚿",
    description: "Meuble vasque, carrelage mural, paroi de douche",
    uploadHint: "Votre photo de salle de bain",
    uploadTip: "Photographiez l'ensemble de la pièce, de face, bien éclairée",
    elements: [
      { key: "zone1", label: "Meuble vasque", description: "Le meuble sous le lavabo et ses façades" },
      { key: "zone2", label: "Carrelage mural", description: "Les murs carrelés ou la crédence de la salle de bain" },
      { key: "zone3", label: "Paroi de douche / Baignoire", description: "Le contour de la douche ou de la baignoire" },
    ],
    promptRoomType: "bathroom",
    promptSurfaceContext: "bathroom surfaces — vanity/sink cabinet fronts (NOT the sink bowl), wall tiles or wall cladding, and shower surround or bathtub side panel (NOT the bathtub interior)",
    promptKeepUntouched: [
      "🪞 Mirrors AND their reflections — the mirror MUST reflect the original (pre-modification) room, never the new textures",
      "🚿 Glass shower doors, screens, and panels — stay perfectly transparent, never opaque or textured",
      "Faucets, taps, mixer valves, shower head, hand shower, towel rails, robe hooks — completely untouched",
      "Toilet, toilet seat, toilet flush button, bidet — completely untouched",
      "Sink/wash basin BOWL itself (porcelain part) — never changes color, only the cabinet beneath/around it changes",
      "Bathtub interior (the porcelain/acrylic bathing area) — only the side panel changes, the inside stays pure white/original",
      "Soap dispensers, toothbrush holders, towel bars, decorative items, plants — completely untouched",
      "Light fixtures, electrical outlets, switches, towel warmers/heated rails, ventilation grilles — completely untouched",
      "Floor, ceiling, windows, window frames — completely untouched",
    ],
    promptSpecificRules:
      "🪞 CRITICAL FOR MIRRORS: any mirror visible in the photo must show its ORIGINAL reflection — do NOT apply the new tile/cabinet textures inside mirror reflections. 🚿 GLASS SHOWER: keep transparent, do not opaque it. ✋ The wash basin bowl is NOT part of the vanity cabinet — only the wood/laminate cabinet beneath/around the sink gets the new texture. 🛁 Bathtub: only the side/skirt panel changes, the bathing surface remains untouched. Carrelage mural: replace tile pattern only on existing tiled walls — do not extend onto painted walls.",
    crmTypeProjet: "SDB",
  },
  {
    id: "meubles",
    label: "Meubles / Dressing",
    icon: "🪑",
    description: "Façades, étagères, structure",
    uploadHint: "Votre photo du meuble ou dressing",
    uploadTip: "Prenez la photo de face, portes fermées, bien éclairé",
    elements: [
      { key: "zone1", label: "Façades / Portes", description: "Les portes, tiroirs et panneaux avant" },
      { key: "zone2", label: "Plateau / Tablettes", description: "Le dessus et les étagères visibles" },
      { key: "zone3", label: "Côtés / Structure", description: "Les panneaux latéraux et la structure" },
    ],
    promptRoomType: "furniture/wardrobe/closet",
    promptSurfaceContext: "furniture covering surfaces — cabinet/wardrobe door fronts and drawer fronts (façades), top surface and visible shelves, and side panels and structural frame",
    promptKeepUntouched: [
      "Handles, knobs, drawer pulls, hinges — same exact style, finish, and placement (never replaced or moved)",
      "Visible interior contents: clothes, hangers, shelves contents, books, items, drawers — 100% pixel-identical, exact same arrangement",
      "Mirrors on the furniture (e.g., wardrobe mirrors) — keep their reflection identical to the original",
      "Glass panels or transparent inserts — stay transparent, never opaque",
      "Floor and walls visible behind/around the furniture — completely untouched",
      "Other furniture or items in the room (chairs, beds, lamps) — completely untouched",
      "Light fixtures, lamps, electrical outlets, light switches — completely untouched",
      "Decorative items on top of the furniture (vases, frames, books) — stay exactly as photographed",
    ],
    promptSpecificRules:
      "This is a piece of furniture — only its visible covering panels change. Door panels keep the exact same number, alignment, hinge positions, and gaps. Drawer fronts keep the exact same number, sizes, and proportions. If doors are open and the interior is visible, the interior contents (clothes, shelves, hangers) stay PIXEL-identical in the same position. The 'top surface' (plateau) is the horizontal top of the furniture, the 'côtés' are the visible side/lateral panels — distinguish them carefully.",
    crmTypeProjet: "MEUBLES",
  },
  {
    id: "mur-plafond",
    label: "Murs / Plafond",
    icon: "🏠",
    description: "Mur d'accent, mur principal, plafond",
    uploadHint: "Votre photo de la pièce",
    uploadTip: "Cadrez le mur entier de face, du sol au plafond si possible",
    elements: [
      { key: "zone1", label: "Mur principal", description: "Le mur le plus large ou le plus visible" },
      { key: "zone2", label: "Mur d'accent", description: "Un second mur ou une portion décorative" },
      { key: "zone3", label: "Plafond", description: "La surface du plafond" },
    ],
    promptRoomType: "interior room (walls and ceiling)",
    promptSurfaceContext: "wall and ceiling SURFACES only — main wall, accent/feature wall, and ceiling (NOT the architectural elements on them)",
    promptKeepUntouched: [
      "Artwork, paintings, photos, posters, frames, decorative wall objects — completely untouched",
      "Light fixtures, ceiling fans, pendant lights, sconces, lamps — completely untouched and at the same position",
      "Light switches, electrical outlets, thermostats, alarms, smoke detectors — completely untouched",
      "Wall trim, baseboards (plinthes), crown molding (corniches), chair rails, picture rails — same exact profile, color (typically white), and position",
      "Doors, door frames, doorknobs, hinges — completely untouched",
      "Windows, window frames, sills, blinds, curtains, drapes — completely untouched",
      "All furniture and items in the room (sofas, tables, beds, chairs) — completely untouched",
      "Floor, rugs, carpets — completely untouched",
      "Other walls not selected — keep their original color/material exactly",
    ],
    promptSpecificRules:
      "Only the wall/ceiling SURFACE changes — not the architectural elements on it. Trim, baseboards (plinthes), crown molding must remain in place with their original color (typically white). The new wall texture extends only to where trim begins. For ceilings: preserve all fixtures, fans, and pendants; the new texture fills only the visible flat ceiling surface around them. If only one wall is selected, the OTHER walls must keep their EXACT original color — do not 'harmonize' them.",
    crmTypeProjet: "AUTRE",
  },
  {
    id: "professionnel",
    label: "Bureau / Comptoir pro",
    icon: "💼",
    description: "Bureau, rangements, habillage mural",
    uploadHint: "Votre photo de l'espace professionnel",
    uploadTip: "Photographiez l'espace de face avec un bon éclairage",
    elements: [
      { key: "zone1", label: "Bureau / Comptoir", description: "La surface de travail ou comptoir d'accueil" },
      { key: "zone2", label: "Façades / Rangements", description: "Les portes de placard et rangements" },
      { key: "zone3", label: "Habillage mural", description: "Le revêtement mural ou panneau décoratif" },
    ],
    promptRoomType: "professional workspace / reception desk / office",
    promptSurfaceContext: "professional space surfaces — desk top or reception counter top surface, storage/cabinet door fronts, and wall cladding or decorative wall panel",
    promptKeepUntouched: [
      "💻 Computer screens, monitors, laptops, keyboards, mice, phones, headsets — completely untouched",
      "Papers, files, folders, notebooks, books, office supplies on the desk — completely untouched, exact same position",
      "Office chairs, seats, sofas — completely untouched",
      "Plants, decorative items, picture frames, plaques — completely untouched",
      "Brand signage, logos, company branding on walls or counter — completely untouched (preserve them in their exact original form)",
      "Light fixtures, lamps, electrical outlets, switches, network ports, USB ports — completely untouched",
      "Floor, ceiling, windows, window frames — completely untouched",
      "Doors, door frames — completely untouched",
      "Cash registers, POS terminals, card readers, scanners — completely untouched",
    ],
    promptSpecificRules:
      "This is a professional workspace. Office equipment (screens, computers, papers, files, phones) is NOT a surface to cover — these items sit on the desk and stay 100% pixel-identical. The desk/counter surface gets the new texture but everything ON the desk stays as photographed. Brand signage and logos on walls or counter front: NEVER replaced, hidden, or modified — they remain in their exact original form (this is critical for B2B clients). Only the bare physical surfaces get covered.",
    crmTypeProjet: "PRO",
  },
];

/** Retrouve un projet par ID, fallback cuisine */
export function getProject(id: string): ProjectType {
  return PROJECT_TYPES.find((p) => p.id === id) || PROJECT_TYPES[0];
}

/** Crée l'état initial des éléments pour un projet donné */
export function createEmptyElements(project: ProjectType): Record<string, {
  enabled: boolean;
  ref: string;
  name: string;
  famille: string;
  finition: string;
  categorie: string;
  tags: string[];
  image: string;
}> {
  const out: Record<string, {
    enabled: boolean;
    ref: string;
    name: string;
    famille: string;
    finition: string;
    categorie: string;
    tags: string[];
    image: string;
  }> = {};
  for (const el of project.elements) {
    out[el.key] = { enabled: false, ref: "", name: "", famille: "", finition: "", categorie: "", tags: [], image: "" };
  }
  return out;
}
