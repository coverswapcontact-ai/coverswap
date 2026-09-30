/**
 * L'offre CoverSwap SANS le catalogue (mission 16, partie 4) : délais, garantie, prix, fourchettes, durées. Un
 * composant client (formulaires de /pro et /contact, simulateur) importe d'ici : `offre.ts` importe le catalogue
 * entier (`revetements.json`, pour compter les références) et l'embarquerait dans la page. `offre.ts` réexporte
 * tout : les pages serveur n'ont rien à changer.
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
/** La même durée en toutes lettres, pour les phrases (« Votre cuisine, transformée en une journée. ») ; va avec `DUREE_POSE`. */
export const DUREE_POSE_TEXTE = "une journée";

/**
 * Simulation : le rendu arrive en « environ 1 min 30 » (mission 15 : la
 * génération est asynchrone ; l'attente médiane observée, arrondie). Une seule
 * formulation, reprise PARTOUT où le site promet un délai (accueil, pied de
 * page, blog, zones, FAQ, page du simulateur) ; l'écran d'attente, lui,
 * annonce l'estimation calculée par le CRM. `DUREE_SIMULATION` y renvoie.
 */
export const DELAI_RENDU = "environ 1 min 30"; // va avec `lib/simulateur/reprise.ts › ATTENTE_PAR_DEFAUT_S` (90 s)
export const DUREE_SIMULATION = DELAI_RENDU;

/** Acompte à la signature du devis, validité du devis. */
export const ACOMPTE_POURCENT = 30;
export const VALIDITE_DEVIS_JOURS = 30;

export function euros(valeur: number): string {
  return `${valeur.toLocaleString("fr-FR")} €`;
}

export function fourchette(cle: keyof typeof FOURCHETTES): string {
  const f = FOURCHETTES[cle];
  if (f.min && f.max) return `${euros(f.min)} à ${euros(f.max)}`;
  if (f.min) return `dès ${euros(f.min)}`;
  return "sur devis";
}
