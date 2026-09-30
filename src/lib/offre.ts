import revetements from "@/data/revetements.json";
import { ACOMPTE_POURCENT, DELAI_REPONSE, DELAI_REPONSE_COURT, DUREE_POSE, DUREE_SIMULATION, FACTEURS_PRIX, FOURCHETTES, GARANTIE, GARANTIE_ANS, GARANTIE_ETENDUE_ANS, PRIX_EXPLICATION, PRIX_ML_MAX, PRIX_ML_MIN, PRIX_PLAGE, UNITE_PRIX, VALIDITE_DEVIS_JOURS } from "./offre-legere";

/**
 * L'offre CoverSwap : une seule source pour les chiffres que le site répète.
 * Tout texte qui cite un délai, une garantie, un prix ou le nombre de
 * références lit ici — jamais un nombre en dur dans une page.
 *
 * Les constantes sans le catalogue vivent dans `offre-legere.ts` (importable par un composant client sans
 * embarquer le catalogue) et sont réexportées ici.
 *
 * Facturation au mètre linéaire de film posé, prix fourni et posé, TVA non
 * applicable. Le mètre carré n'est jamais une unité de prix ici.
 */

export * from "./offre-legere";

/** Nombre exact de références du catalogue Cover Styl' (compté dans les données). */
export const NB_REFERENCES = (revetements as unknown[]).length;
export const NB_REFERENCES_TEXTE = `${NB_REFERENCES} références`;

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

/** Remplace les marqueurs {NB}, {DELAI} et {PRIX} d'un texte de données (zones) par les valeurs de l'offre. */
export function texteOffre(texte: string): string {
  return texte.replaceAll("{NB}", String(NB_REFERENCES)).replaceAll("{DELAI}", DELAI_REPONSE).replaceAll("{PRIX}", PRIX_PLAGE);
}
