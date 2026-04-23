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
  promptRoomType: string;      // "kitchen" | "bathroom" | etc. pour le prompt IA
  promptSurfaceContext: string; // description des surfaces pour guider l'IA
  crmTypeProjet: string;       // CUISINE | SDB | MEUBLES | PRO | AUTRE
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
    promptSurfaceContext: "bathroom surfaces — vanity/sink cabinet fronts, wall tiles or wall cladding, and shower surround or bathtub panel",
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
    promptRoomType: "furniture",
    promptSurfaceContext: "furniture surfaces — cabinet door fronts and drawer fronts, top surface and shelves, and side panels and structural frame",
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
    promptRoomType: "room walls and ceiling",
    promptSurfaceContext: "wall and ceiling surfaces — main wall, accent/feature wall, and ceiling",
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
    promptRoomType: "professional workspace / reception desk area",
    promptSurfaceContext: "professional space surfaces — desk or reception counter surface, storage/cabinet door fronts, and wall cladding or decorative panel",
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
