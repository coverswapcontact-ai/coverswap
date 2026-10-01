import { DUREE_POSE_TEXTE, PRIX_PLAGE } from "@/lib/offre";

/**
 * L'accueil (mission 16, partie 3) : huit sections, dans cet ordre, rien
 * d'autre (énoncé § 3) ; mission 19 : neuf, avec la rangée « Inspirations » après les réalisations. `page.tsx` rend EXACTEMENT cette liste : une section
 * ajoutée ailleurs ne compile pas (`Record<IdSectionAccueil, …>`), une section
 * retirée d'ici disparaît de la page. Module pur (testé sans React).
 */
export type IdSectionAccueil = "ouverture" | "essayer" | "faits" | "matieres" | "realisations" | "inspirations" | "comment" | "confiance" | "dernier-appel";

export const SECTIONS_ACCUEIL: readonly { id: IdSectionAccueil; nom: string }[] = [
  { id: "ouverture", nom: "Ouverture" },
  { id: "essayer", nom: "Essayez sur votre photo" },
  { id: "faits", nom: "Trois faits" },
  { id: "matieres", nom: "Matières" },
  { id: "realisations", nom: "Réalisations" },
  { id: "inspirations", nom: "Inspirations" },
  { id: "comment", nom: "Comment ça marche" },
  { id: "confiance", nom: "Confiance" },
  { id: "dernier-appel", nom: "Dernier appel" },
];

/** La liste des sections de l'accueil, dans l'ordre. */
export function sectionsAccueil(): { id: IdSectionAccueil; nom: string }[] {
  return SECTIONS_ACCUEIL.map((s) => ({ ...s }));
}

/** La phrase de l'ouverture et du dernier appel (7 mots au plus). */
export const TITRE_ACCUEIL = `Votre cuisine, transformée en ${DUREE_POSE_TEXTE}.`;
export const LIGNE_ACCUEIL = "Sans travaux, sans remplacer vos meubles. Réversible.";

/** Métadonnées de l'accueil (description : 155 caractères au plus, testé). */
export const TITRE_META_ACCUEIL = `CoverSwap — Votre cuisine transformée en ${DUREE_POSE_TEXTE}, sans travaux`;
export const DESCRIPTION_META_ACCUEIL = `Covering adhésif à Montpellier : votre cuisine rénovée en ${DUREE_POSE_TEXTE}, sans travaux. ${PRIX_PLAGE} fourni et posé. Simulation gratuite sur votre photo.`;

/**
 * D'où vient un clic sur « Simuler ma cuisine » : l'ouverture, le bouton collé du téléphone, « Comment ça marche », le
 * dernier appel. Porté par `?depuis=` et repris par le simulateur dans le meta de PIECE_CHOISIE.
 */
export type DepuisAccueil = "accueil-ouverture" | "accueil-colle" | "accueil-etapes" | "accueil-final";

export function lienSimulerCuisine(depuis?: DepuisAccueil): string {
  return `/simulateur?projet=cuisine${depuis ? `&depuis=${depuis}` : ""}`;
}

/**
 * Les ancres que le bouton collé du téléphone surveille : il n'apparaît qu'une fois le bouton de l'ouverture sorti de
 * l'écran, et s'efface tant qu'un autre bouton principal est à l'écran (le module de simulation, « Comment ça marche »,
 * le dernier appel) ou que le pied de page l'est (il cacherait les liens du bas).
 */
export const ANCRES_ACCUEIL = {
  boutonOuverture: "ouverture-simuler",
  simulation: "simulation",
  boutonEtapes: "etapes-simuler",
  dernierAppel: "dernier-appel",
  pied: "pied-de-page",
} as const;

export const CIBLES_BOUTON_COLLE: string[] = [ANCRES_ACCUEIL.boutonOuverture, ANCRES_ACCUEIL.simulation, ANCRES_ACCUEIL.boutonEtapes, ANCRES_ACCUEIL.dernierAppel, ANCRES_ACCUEIL.pied];
