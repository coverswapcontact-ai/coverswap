import type { EtatSimulateur, Selection } from "./reprise";
import type { PieceSimulateur } from "./zones";

/**
 * La matière présélectionnée (mission 16, partie 4) : `/simulateur?ref=<ref>` (bouton « Essayer sur ma photo » de
 * /matieres). La référence est gardée dans la mémoire du parcours (`refDemandee`) ; à l'écran des matières, la
 * PREMIÈRE zone de la pièce — l'ordre du CRM met les façades d'abord — la reçoit, même si elle avait déjà une matière
 * (la personne vient de la choisir exprès), puis la demande est oubliée. Pur, testé.
 */

/** Une référence du catalogue telle qu'une adresse peut la porter (« K1 », « NE31 », « AB02 »), sinon rien. */
export function lireRefDemandee(valeur: string | null | undefined): string | null {
  const ref = valeur?.trim() ?? "";
  return /^[A-Za-z0-9-]{1,20}$/.test(ref) ? ref : null;
}

/** Les sélections avec la matière posée sur la première zone (ses zones incompatibles vidées) ; null si la pièce n'a pas de zone. */
export function appliquerMatiereDemandee(selections: EtatSimulateur["selections"], piece: PieceSimulateur, matiere: Selection): EtatSimulateur["selections"] | null {
  const zone = piece.zones[0];
  if (!zone) return null;
  const suivantes: EtatSimulateur["selections"] = { ...selections, [zone.id]: matiere };
  for (const autre of zone.exclut) suivantes[autre] = null;
  return suivantes;
}
