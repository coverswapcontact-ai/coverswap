/**
 * Les pièces du simulateur, côté écran (mission 15, partie 4) : ce qui ne
 * vient pas du CRM — les conseils de cadrage de la photo et le type de projet
 * du CRM pour la demande de devis. Les libellés, titres et zones viennent de
 * `GET <CRM>/api/site/simulateur` (`lib/simulateur/zones.ts`). Plus aucune
 * consigne de moteur ici : le CRM la construit (mission 15, partie 2).
 */
export interface ProjectType {
  id: string;
  label: string;
  description: string;
  /** Titre de l'écran photo. */
  uploadHint: string;
  /** Conseil de cadrage propre à la pièce. */
  uploadTip: string;
  /** CUISINE | SDB | MEUBLES | PRO | AUTRE */
  crmTypeProjet: string;
}

export const PROJECT_TYPES: ProjectType[] = [
  { id: "cuisine", label: "Cuisine", description: "Façades, meubles hauts ou bas, plan de travail, crédence", uploadHint: "Votre photo de cuisine", uploadTip: "De face, bien éclairée, toute la cuisine dans le cadre", crmTypeProjet: "CUISINE" },
  { id: "salle-de-bain", label: "Salle de bain", description: "Meuble vasque, plan vasque, murs carrelés, tablier de baignoire", uploadHint: "Votre photo de salle de bain", uploadTip: "De face, toute la pièce visible, lumière allumée", crmTypeProjet: "SDB" },
  { id: "meubles", label: "Meubles", description: "Portes de dressing et placards, meuble TV, commode, buffet", uploadHint: "Votre photo du meuble", uploadTip: "De face, portes fermées, tout le meuble dans le cadre", crmTypeProjet: "MEUBLES" },
  { id: "mur-plafond", label: "Murs, plafond", description: "Mur principal, second mur, plafond", uploadHint: "Votre photo de la pièce", uploadTip: "Le mur entier de face, du sol au plafond si possible", crmTypeProjet: "AUTRE" },
  { id: "professionnel", label: "Local professionnel", description: "Bar, comptoir, mobilier, rangements, habillage mural", uploadHint: "Votre photo du local", uploadTip: "De face, avec un bon éclairage, tout le comptoir ou le mobilier visible", crmTypeProjet: "PRO" },
];

/** Retrouve une pièce par identifiant ; cuisine à défaut. */
export function getProject(id: string): ProjectType {
  return PROJECT_TYPES.find((p) => p.id === id) || PROJECT_TYPES[0];
}
