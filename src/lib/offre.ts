import revetements from "@/data/revetements.json";

/**
 * L'offre CoverSwap : une seule source pour les chiffres que le site répète.
 * Tout texte qui cite un délai, une garantie, un prix ou le nombre de
 * références lit ici — jamais un nombre en dur dans une page.
 *
 * Ce que vaut chaque valeur : à faire évoluer ICI, et seulement ici.
 */

/** Délai de réponse à une demande de devis ou de contact. */
export const DELAI_REPONSE = "sous 48 h";
/** Même délai, forme courte pour les titres et badges. */
export const DELAI_REPONSE_COURT = "48 h";

/** Garantie sur la pose et les films Cover Styl' (décollement, décoloration). */
export const GARANTIE_ANS = 10;
export const GARANTIE = `${GARANTIE_ANS} ans`;
/** Références haute température : garantie étendue du fabricant. */
export const GARANTIE_ETENDUE_ANS = 15;

/** Tarif de départ, fourni et posé, surfaces lisses. */
export const PRIX_M2_DEPUIS = 80;
export const SURFACE_MINIMUM_M2 = 20;
export const PRIX_DEPUIS = `${PRIX_M2_DEPUIS} €/m²`;

/** Pose : une journée pour une cuisine ou une salle de bain courante. */
export const DUREE_POSE = "1 journée";

/** Simulation IA : rendu en moins d'une minute. */
export const DUREE_SIMULATION = "60 secondes";

/** Nombre exact de références du catalogue Cover Styl' (compté dans les données). */
export const NB_REFERENCES = (revetements as unknown[]).length;
export const NB_REFERENCES_TEXTE = `${NB_REFERENCES} références`;

/** Acompte à la signature du devis. */
export const ACOMPTE_POURCENT = 30;

export const OFFRE = {
  delaiReponse: DELAI_REPONSE,
  delaiReponseCourt: DELAI_REPONSE_COURT,
  garantie: GARANTIE,
  garantieAns: GARANTIE_ANS,
  garantieEtendueAns: GARANTIE_ETENDUE_ANS,
  prixDepuis: PRIX_DEPUIS,
  prixM2Depuis: PRIX_M2_DEPUIS,
  surfaceMinimumM2: SURFACE_MINIMUM_M2,
  dureePose: DUREE_POSE,
  dureeSimulation: DUREE_SIMULATION,
  nbReferences: NB_REFERENCES,
  nbReferencesTexte: NB_REFERENCES_TEXTE,
  acomptePourcent: ACOMPTE_POURCENT,
} as const;

/** Remplace les marqueurs {NB} et {DELAI} d'un texte de données (zones) par les valeurs de l'offre. */
export function texteOffre(texte: string): string {
  return texte.replaceAll("{NB}", String(NB_REFERENCES)).replaceAll("{DELAI}", DELAI_REPONSE);
}
