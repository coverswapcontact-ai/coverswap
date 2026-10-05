import { lienSimuler } from "@/lib/liens-simulateur";
import { DUREE_POSE_TEXTE, PRIX_PLAGE } from "@/lib/offre";

/**
 * L'accueil du site 3.0 (lot B6), dans l'ordre du tunnel de vente (énoncé, § C.1) : il DÉCOUVRE (ouverture), il SE
 * PROJETTE (par où commencer, des cuisines comme la sienne), il est RASSURÉ (comment on travaille, le présentoir,
 * les réalisations, les professionnels, avis et prix, les questions), il DEMANDE (le dernier appel, dans la section
 * des questions). `page.tsx` rend EXACTEMENT cette liste : une section ajoutée ailleurs ne compile pas
 * (`Record<IdSectionAccueil, …>`), une section retirée d'ici disparaît de la page. Module pur (testé sans React).
 */
export type IdSectionAccueil = "ouverture" | "par-ou-commencer" | "cuisines" | "comment" | "presentoir" | "realisations" | "pro" | "avis-prix" | "questions";

export const SECTIONS_ACCUEIL: readonly { id: IdSectionAccueil; nom: string }[] = [
  { id: "ouverture", nom: "Ouverture" },
  { id: "par-ou-commencer", nom: "Par où commencer ?" },
  { id: "cuisines", nom: "Des cuisines comme la vôtre" },
  { id: "comment", nom: "Comment on travaille" },
  { id: "presentoir", nom: "Le présentoir" },
  { id: "realisations", nom: "Réalisations" },
  { id: "pro", nom: "Professionnels" },
  { id: "avis-prix", nom: "Avis et prix" },
  { id: "questions", nom: "Questions, puis le dernier appel" },
];

/** La liste des sections de l'accueil, dans l'ordre. */
export function sectionsAccueil(): { id: IdSectionAccueil; nom: string }[] {
  return SECTIONS_ACCUEIL.map((s) => ({ ...s }));
}

/**
 * Les bandes de matière (énoncé, phase B, « La couleur ») qui séparent les grandes sections : la référence du
 * catalogue et la section APRÈS laquelle elle se pose (le vert profond ferme le présentoir, dedans). Chêne, marbre,
 * vert profond, terracotta, bleu nuit.
 */
export const BANDES_ACCUEIL: readonly { ref: string; apres: IdSectionAccueil | "dans-presentoir"; nom: string }[] = [
  { ref: "AG13", apres: "par-ou-commencer", nom: "chêne" },
  { ref: "NE31", apres: "comment", nom: "marbre" },
  { ref: "NF13", apres: "dans-presentoir", nom: "vert profond" },
  { ref: "NH12", apres: "realisations", nom: "terracotta" },
  { ref: "M9", apres: "avis-prix", nom: "bleu nuit" },
];

/** La promesse de l'ouverture et du dernier appel (7 mots au plus). */
export const TITRE_ACCUEIL = `Votre cuisine, transformée en ${DUREE_POSE_TEXTE}.`;
export const LIGNE_ACCUEIL = "Sans travaux, sans remplacer vos meubles. Réversible.";

/** Métadonnées de l'accueil (description : 155 caractères au plus, testé). */
export const TITRE_META_ACCUEIL = `CoverSwap — Votre cuisine transformée en ${DUREE_POSE_TEXTE}, sans travaux`;
export const DESCRIPTION_META_ACCUEIL = `Covering adhésif à Montpellier : votre cuisine rénovée en ${DUREE_POSE_TEXTE}, sans travaux. ${PRIX_PLAGE} fourni et posé. Simulation gratuite sur votre photo.`;

/**
 * D'où vient un clic vers le simulateur depuis l'accueil : l'ouverture, le bouton collé du téléphone, « Comment on
 * travaille », le dernier appel ; site 3.0 (lot B6) : les pictos de « Par où commencer ? » (`accueil`) et les
 * compositions de « Des cuisines comme la vôtre » (`accueil-cuisines`). Porté par `?depuis=` et repris par le
 * simulateur dans le meta de PIECE_CHOISIE (docs/SUIVI.md).
 */
export type DepuisAccueil = "accueil-ouverture" | "accueil-colle" | "accueil-etapes" | "accueil-final" | "accueil" | "accueil-cuisines";

/** « Simuler ma pièce » (ouverture, étapes, dernier appel, bouton collé) : le simulateur à l'écran 1, sans pièce imposée. */
export function lienSimulerAccueil(depuis: DepuisAccueil): string {
  return lienSimuler({ depuis });
}

/**
 * Les ancres que le bouton collé du téléphone surveille : il n'apparaît qu'une fois le bouton de l'ouverture sorti de
 * l'écran, et s'efface tant qu'un autre appel est à l'écran (les pictos de « Par où commencer ? », le bouton de
 * « Comment on travaille », le dernier appel) ou que le pied de page l'est (il cacherait les liens du bas).
 */
export const ANCRES_ACCUEIL = {
  boutonOuverture: "ouverture-simuler",
  parOuCommencer: "par-ou-commencer",
  boutonEtapes: "etapes-simuler",
  dernierAppel: "dernier-appel",
  pied: "pied-de-page",
} as const;

export const CIBLES_BOUTON_COLLE: string[] = [ANCRES_ACCUEIL.boutonOuverture, ANCRES_ACCUEIL.parOuCommencer, ANCRES_ACCUEIL.boutonEtapes, ANCRES_ACCUEIL.dernierAppel, ANCRES_ACCUEIL.pied];
