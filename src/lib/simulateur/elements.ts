/**
 * Les éléments précis qu'on peut choisir avant la pièce (site 3.0, lot B6 : les pictos de l'accueil ; le lot E2 les
 * mettra aussi à l'écran 1 du simulateur). Chacun mène à une pièce du simulateur et à la zone qui le couvre ; le moteur
 * du CRM ne change pas (mêmes pièces, mêmes zones). La porte d'entrée et le réfrigérateur sont rattachés côté site
 * (portes du dressing, façades de cuisine) : les consignes du CRM restent les mêmes. Module pur.
 */
export type IdElement = "porte-interieure" | "placard-coulissant" | "plan-de-travail" | "meuble-vasque" | "commode" | "porte-entree" | "refrigerateur";

export type ElementPrecis = { id: IdElement; libelle: string; piece: string; zone: string };

/** Dans l'ordre de l'énoncé (« portes, placards, plan de travail, meuble vasque, commode, porte d'entrée, réfrigérateur »). */
export const ELEMENTS: readonly ElementPrecis[] = [
  { id: "porte-interieure", libelle: "Portes", piece: "meubles", zone: "portes-dressing" },
  { id: "placard-coulissant", libelle: "Placards", piece: "meubles", zone: "portes-dressing" },
  { id: "plan-de-travail", libelle: "Plan de travail", piece: "cuisine", zone: "plan-de-travail" },
  { id: "meuble-vasque", libelle: "Meuble vasque", piece: "salle-de-bain", zone: "meuble-vasque" },
  { id: "commode", libelle: "Commode", piece: "meubles", zone: "meuble-complet" },
  { id: "porte-entree", libelle: "Porte d'entrée", piece: "meubles", zone: "portes-dressing" },
  { id: "refrigerateur", libelle: "Réfrigérateur", piece: "cuisine", zone: "facades-cuisine" },
];

/** L'élément d'une adresse (`?element=`), s'il est connu ; sinon rien. */
export function elementPrecis(id: string | null | undefined): ElementPrecis | null {
  return ELEMENTS.find((e) => e.id === id) ?? null;
}

/** La zone à ouvrir d'abord pour cet élément, s'il appartient bien à la pièce ouverte ; sinon rien. */
export function zoneDeLElement(id: string | null | undefined, piece: string): string | null {
  const element = elementPrecis(id);
  return element && element.piece === piece ? element.zone : null;
}
