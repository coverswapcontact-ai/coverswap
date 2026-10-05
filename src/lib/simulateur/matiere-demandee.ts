import type { EtatSimulateur, Selection } from "./reprise";
import type { PieceSimulateur } from "./zones";
import { elementPrecis, type IdElement } from "./elements";

/**
 * La matière présélectionnée (mission 16, partie 4) : `/simulateur?ref=<ref>` (bouton « Essayer sur ma photo » de
 * /matieres). La référence est gardée dans la mémoire du parcours (`refDemandee`) ; à l'écran des matières, la
 * PREMIÈRE zone de la pièce — l'ordre du CRM met les façades d'abord — la reçoit, même si elle avait déjà une matière
 * (la personne vient de la choisir exprès), puis la demande est oubliée. Pur, testé.
 *
 * Mission 19 : une COMPOSITION entière (« Essayer cette composition chez moi », sous une photo d'ambiance) passe par
 * le même paramètre, zone par zone : `?ref=meubles-bas:RM20,meubles-hauts:I14,plan-de-travail:NE31`. Chaque zone
 * connue de la pièce reçoit sa matière (ses zones incompatibles vidées), dans l'ordre ; une zone inconnue est ignorée.
 */

const REF = "[A-Za-z0-9-]{1,20}";
const ZONE = "[a-z0-9-]{1,40}";
const COMPOSITION = new RegExp(`^${ZONE}:${REF}(,${ZONE}:${REF}){0,5}$`);

/** Une référence du catalogue telle qu'une adresse peut la porter (« K1 », « NE31 », « AB02 »), ou une composition (`zone:REF,…`), sinon rien. */
export function lireRefDemandee(valeur: string | null | undefined): string | null {
  const ref = valeur?.trim() ?? "";
  if (/^[A-Za-z0-9-]{1,20}$/.test(ref)) return ref;
  return COMPOSITION.test(ref) ? ref : null;
}

/** Une composition (`zone:REF,…`) : ses couples, dans l'ordre ; une référence seule n'en est pas une (null). */
export function lireComposition(demande: string | null | undefined): { zone: string; ref: string }[] | null {
  if (!demande || !COMPOSITION.test(demande)) return null;
  return demande.split(",").map((couple) => {
    const [zone, ref] = couple.split(":");
    return { zone, ref };
  });
}

/** Les sélections avec la matière posée sur la première zone (ses zones incompatibles vidées) ; null si la pièce n'a pas de zone. */
export function appliquerMatiereDemandee(selections: EtatSimulateur["selections"], piece: PieceSimulateur, matiere: Selection): EtatSimulateur["selections"] | null {
  const zone = piece.zones[0];
  if (!zone) return null;
  const suivantes: EtatSimulateur["selections"] = {
    ...selections,
    [zone.id]: matiere,
  };
  for (const autre of zone.exclut) suivantes[autre] = null;
  return suivantes;
}

/**
 * Les sélections avec une composition posée zone par zone (chaque zone vide ses zones incompatibles, dans l'ordre) ;
 * null si aucune zone de la composition n'est dans la pièce. `matieres` : la matière de chaque référence connue du
 * catalogue (une référence inconnue laisse sa zone telle quelle).
 */
export function appliquerComposition(
  selections: EtatSimulateur["selections"],
  piece: PieceSimulateur,
  composition: readonly { zone: string; ref: string }[],
  matieres: ReadonlyMap<string, Selection>,
): EtatSimulateur["selections"] | null {
  let suivantes: EtatSimulateur["selections"] = { ...selections };
  let posees = 0;
  for (const { zone: id, ref } of composition) {
    const zone = piece.zones.find((z) => z.id === id);
    const matiere = matieres.get(ref);
    if (!zone || !matiere) continue;
    for (const autre of zone.exclut) suivantes[autre] = null;
    suivantes = { ...suivantes, [zone.id]: matiere };
    posees += 1;
  }
  return posees > 0 ? suivantes : null;
}

/**
 * Site 3.0, lot B6 : l'élément précis demandé par `?element=` (un picto de l'accueil : « Plan de travail »,
 * « Réfrigérateur »…), s'il est connu (`elements.ts`), sinon rien. Sa zone s'ouvre d'abord à l'écran des matières
 * (`useMatiereDemandee`), seulement si elle appartient à la pièce ouverte (`zoneDeLElement`).
 */
export function lireElementDemande(valeur: string | null | undefined): IdElement | null {
  return elementPrecis(valeur?.trim())?.id ?? null;
}
