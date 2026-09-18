import revetements from "@/data/revetements.json";

/**
 * L'offre CoverSwap : une seule source pour les chiffres que le site répète.
 * Tout texte qui cite un délai, une garantie, un prix ou le nombre de
 * références lit ici — jamais un nombre en dur dans une page.
 *
 * Facturation au mètre linéaire de film posé, prix fourni et posé, TVA non
 * applicable. Le mètre carré n'est jamais une unité de prix ici.
 */

/** Délai de réponse à une demande de devis ou de contact. */
export const DELAI_REPONSE = "sous 48 h";
export const DELAI_REPONSE_COURT = "48 h";

/** Garantie sur la pose et les films Cover Styl' (décollement, décoloration). */
export const GARANTIE_ANS = 10;
export const GARANTIE = `${GARANTIE_ANS} ans`;
/** Références haute température : garantie étendue du fabricant. */
export const GARANTIE_ETENDUE_ANS = 15;

/**
 * Tarif au mètre linéaire de film posé, fourni et posé. Le prix ne dépend pas
 * du seul revêtement : il se détermine au devis selon la complexité de la pose
 * (nombre de découpes, accessibilité, état du support, métrage).
 *  - autour de 50 €/ml : grandes surfaces planes, sans découpe ;
 *  - jusqu'à 150 €/ml : pose complexe (découpes nombreuses, accès difficile,
 *    support à préparer, petit métrage).
 * Le site annonce toujours la plage entière et dit ce qui la fait varier :
 * ni le bas ni le haut ne sont la norme.
 */
export const PRIX_ML_MIN = 50;
export const PRIX_ML_MAX = 150;
export const PRIX_PLAGE = `${PRIX_ML_MIN} à ${PRIX_ML_MAX} €/ml`;
export const UNITE_PRIX = "mètre linéaire de film posé";
/** Ce qui fait le prix au mètre : la pose, pas le seul choix du revêtement. */
export const FACTEURS_PRIX = "le nombre de découpes, l'accessibilité, l'état du support et le métrage";
/** La phrase de référence, reprise telle quelle partout où le prix est expliqué. */
export const PRIX_EXPLICATION = `Le prix au mètre linéaire se détermine au devis, selon la complexité de la pose : ${FACTEURS_PRIX}. Il va de ${PRIX_ML_MIN} €/ml pour de grandes surfaces planes sans découpe à ${PRIX_ML_MAX} €/ml pour une pose complexe : ni l'un ni l'autre n'est la règle, c'est le devis qui fixe le chiffre.`;

/** Fourchettes constatées par type de projet, fourni et posé. */
export const FOURCHETTES = {
  cuisine: { min: 1200, max: 3500, libelle: "cuisine complète (façades, plan de travail, crédence)" },
  sdb: { min: 1200, max: 2500, libelle: "salle de bain (meuble vasque, murs carrelés, contour de baignoire)" },
  meuble: { min: 250, max: null, libelle: "meuble seul (commode, buffet, meuble TV…)" },
  pro: { min: null, max: null, libelle: "local professionnel : sur devis après visite" },
} as const;

/** Pose : une journée pour une cuisine ou une salle de bain courante. */
export const DUREE_POSE = "1 journée";

/** Simulation : rendu en moins d'une minute. */
export const DUREE_SIMULATION = "60 secondes";

/** Nombre exact de références du catalogue Cover Styl' (compté dans les données). */
export const NB_REFERENCES = (revetements as unknown[]).length;
export const NB_REFERENCES_TEXTE = `${NB_REFERENCES} références`;

/** Acompte à la signature du devis, validité du devis. */
export const ACOMPTE_POURCENT = 30;
export const VALIDITE_DEVIS_JOURS = 30;

export const OFFRE = {
  delaiReponse: DELAI_REPONSE,
  delaiReponseCourt: DELAI_REPONSE_COURT,
  garantie: GARANTIE,
  garantieAns: GARANTIE_ANS,
  garantieEtendueAns: GARANTIE_ETENDUE_ANS,
  prixPlage: PRIX_PLAGE,
  prixMlMin: PRIX_ML_MIN,
  prixMlMax: PRIX_ML_MAX,
  facteursPrix: FACTEURS_PRIX,
  prixExplication: PRIX_EXPLICATION,
  unitePrix: UNITE_PRIX,
  fourchettes: FOURCHETTES,
  dureePose: DUREE_POSE,
  dureeSimulation: DUREE_SIMULATION,
  nbReferences: NB_REFERENCES,
  nbReferencesTexte: NB_REFERENCES_TEXTE,
  acomptePourcent: ACOMPTE_POURCENT,
  validiteDevisJours: VALIDITE_DEVIS_JOURS,
} as const;

export function euros(valeur: number): string {
  return `${valeur.toLocaleString("fr-FR")} €`;
}

export function fourchette(cle: keyof typeof FOURCHETTES): string {
  const f = FOURCHETTES[cle];
  if (f.min && f.max) return `${euros(f.min)} à ${euros(f.max)}`;
  if (f.min) return `dès ${euros(f.min)}`;
  return "sur devis";
}

/** Remplace les marqueurs {NB}, {DELAI} et {PRIX} d'un texte de données (zones) par les valeurs de l'offre. */
export function texteOffre(texte: string): string {
  return texte.replaceAll("{NB}", String(NB_REFERENCES)).replaceAll("{DELAI}", DELAI_REPONSE).replaceAll("{PRIX}", PRIX_PLAGE);
}
