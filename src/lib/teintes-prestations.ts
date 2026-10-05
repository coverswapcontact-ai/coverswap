import type { CSSProperties } from "react";

/**
 * Une teinte par prestation (site 3.0, lot B3 ; énoncé, phase B, « La couleur ») : le site est coloré par les
 * matières, pas par l'interface. Chaque prestation prend une vraie référence du catalogue Cover Styl', qui colore
 * le cartel, les filets et les bandes de sa page ET de ses cartes (pictos de l'accueil, cartes des zones, « autres
 * prestations ») :
 *  - cuisine → Sage Green RM20 ; salle de bain → Steel Blue M6 ; meubles → Terracotta Stucco NH12 ;
 *  - portes et placards → Deep Green NF13 ; murs → Lombarda Grigio NF99 ;
 *  - professionnel → Black Mat K1, avec Classic Walnut D1 en seconde teinte ;
 *  - vitrages : aucune teinte (un film de vitrage n'a pas de couleur à montrer).
 *
 * TEXTE EN TEINTE seulement là où il tient 4,5:1 (`texteAutorise`) ; ailleurs, la teinte ne fait que les filets,
 * les cartels et les bandes, et le texte reste à l'encre (ou au papier sur l'encre). Sur le papier, le rapport est
 * pris au pire du papier uni et du papier GRANULÉ (5ᵉ centile du grain mesuré au lot B1, `PAPIER_GRAIN`) : Steel
 * Blue M6 (4,65 sur le papier uni) tombe à 4,31 sous le grain, il n'écrit donc pas sur le papier.
 *
 * Fichier pur et léger (pas d'import du catalogue, qu'un composant client tirerait dans son JavaScript) : les
 * valeurs du catalogue et les contrastes sont recopiés ici et VÉRIFIÉS par `components/revue/revue.test.ts`
 * (parité avec `data/revetements.json`, contrastes recalculés depuis les jetons de `globals.css`).
 */

/** Les fonds sur lesquels un texte peut être posé : le papier (avec son grain), le papier foncé (`fond-2`), l'encre. */
export type FondTexte = "papier" | "papier-2" | "encre";

/** Le seuil WCAG du texte courant. */
export const SEUIL_TEXTE = 4.5;

/** Le papier granulé, 5ᵉ centile (les grains sombres), mesuré au lot B1 (docs/DESIGN.md, « Sous le grain »). */
export const PAPIER_GRAIN = "#EBE5DA";

export type TeinteCatalogue = {
  ref: string;
  nom: string;
  famille: string;
  finition: string;
  hex: string;
  /** Rapport de contraste WCAG de la teinte (en texte) sur chaque fond ; `papier-grain` : sur `PAPIER_GRAIN`. */
  contrastes: { papier: number; "papier-grain": number; "papier-2": number; encre: number };
  /** Où la teinte peut écrire du texte (≥ 4,5:1 ; sur le papier, uni ET granulé). */
  texteAutorise: Record<FondTexte, boolean>;
};

export type IdTeintePrestation = "cuisine" | "salle-de-bain" | "meubles" | "portes-placards" | "murs" | "professionnel";

export type TeintePrestation = { id: IdTeintePrestation; libelle: string; teinte: TeinteCatalogue; seconde?: TeinteCatalogue };

const RM20: TeinteCatalogue = {
  ref: "RM20",
  nom: "Sage Green",
  famille: "couleur",
  finition: "Soft",
  hex: "#616A57",
  contrastes: { papier: 4.87, "papier-grain": 4.52, "papier-2": 4.41, encre: 3.17 },
  texteAutorise: { papier: true, "papier-2": false, encre: false },
};

const M6: TeinteCatalogue = {
  ref: "M6",
  nom: "Steel Blue",
  famille: "couleur",
  finition: "Soft",
  hex: "#666A75",
  contrastes: { papier: 4.65, "papier-grain": 4.31, "papier-2": 4.21, encre: 3.32 },
  texteAutorise: { papier: false, "papier-2": false, encre: false },
};

const NH12: TeinteCatalogue = {
  ref: "NH12",
  nom: "Terracotta Stucco",
  famille: "beton",
  finition: "Soft",
  hex: "#AF9584",
  contrastes: { papier: 2.42, "papier-grain": 2.25, "papier-2": 2.19, encre: 6.37 },
  texteAutorise: { papier: false, "papier-2": false, encre: true },
};

const NF13: TeinteCatalogue = {
  ref: "NF13",
  nom: "Deep Green",
  famille: "couleur",
  finition: "Soft",
  hex: "#23342E",
  contrastes: { papier: 11.27, "papier-grain": 10.46, "papier-2": 10.21, encre: 1.37 },
  texteAutorise: { papier: true, "papier-2": true, encre: false },
};

const NF99: TeinteCatalogue = {
  ref: "NF99",
  nom: "Lombarda Grigio",
  famille: "pierre",
  finition: "Soft",
  hex: "#A59A8E",
  contrastes: { papier: 2.37, "papier-grain": 2.2, "papier-2": 2.15, encre: 6.5 },
  texteAutorise: { papier: false, "papier-2": false, encre: true },
};

const K1: TeinteCatalogue = {
  ref: "K1",
  nom: "Black Mat",
  famille: "couleur",
  finition: "Soft",
  hex: "#232220",
  contrastes: { papier: 13.67, "papier-grain": 12.68, "papier-2": 12.38, encre: 1.13 },
  texteAutorise: { papier: true, "papier-2": true, encre: false },
};

const D1: TeinteCatalogue = {
  ref: "D1",
  nom: "Classic Walnut",
  famille: "bois",
  finition: "Soft",
  hex: "#654835",
  contrastes: { papier: 7.13, "papier-grain": 6.62, "papier-2": 6.46, encre: 2.16 },
  texteAutorise: { papier: true, "papier-2": true, encre: false },
};

export const TEINTES_PRESTATIONS: Readonly<Record<IdTeintePrestation, TeintePrestation>> = {
  cuisine: { id: "cuisine", libelle: "Cuisine", teinte: RM20 },
  "salle-de-bain": { id: "salle-de-bain", libelle: "Salle de bain", teinte: M6 },
  meubles: { id: "meubles", libelle: "Meubles", teinte: NH12 },
  "portes-placards": { id: "portes-placards", libelle: "Portes et placards", teinte: NF13 },
  murs: { id: "murs", libelle: "Murs", teinte: NF99 },
  professionnel: { id: "professionnel", libelle: "Professionnel", teinte: K1, seconde: D1 },
};

/** Les autres noms d'une même prestation : la pièce « mur-plafond » du simulateur, les éléments portes et placards. */
const ALIAS: Readonly<Record<string, IdTeintePrestation>> = {
  "mur-plafond": "murs",
  pro: "professionnel",
  portes: "portes-placards",
  placard: "portes-placards",
  placards: "portes-placards",
  "porte-interieure": "portes-placards",
  "porte-entree": "portes-placards",
};

/** La teinte d'une prestation (slug de page, pièce du simulateur, élément), ou `null` (vitrages, inconnu). */
export function teintePrestation(id: string | null | undefined): TeintePrestation | null {
  if (!id) return null;
  const cle = Object.prototype.hasOwnProperty.call(TEINTES_PRESTATIONS, id) ? (id as IdTeintePrestation) : Object.prototype.hasOwnProperty.call(ALIAS, id) ? ALIAS[id] : null;
  return cle ? TEINTES_PRESTATIONS[cle] : null;
}

/**
 * Le style qui pose la teinte sur un bloc (page, carte) : `--teinte` (et `--teinte-2` pour le pro), lus par `.filet`,
 * le cartel, la bande, le grand numéro. Sans teinte : rien (les filets restent à l'encre).
 */
export function styleTeinte(t: TeintePrestation | TeinteCatalogue | null | undefined): CSSProperties | undefined {
  if (!t) return undefined;
  if ("teinte" in t) return { "--teinte": t.teinte.hex, ...(t.seconde ? { "--teinte-2": t.seconde.hex } : {}) } as CSSProperties;
  return { "--teinte": t.hex } as CSSProperties;
}

/** La classe du texte en teinte (sous un bloc qui porte `styleTeinte`). */
export const TEXTE_EN_TEINTE = "text-[color:var(--teinte)]";

/**
 * La couleur d'un texte qui voudrait la teinte, posé sur `sur` : la teinte si elle y tient 4,5:1, sinon l'encre
 * (le papier sur l'encre). Jamais le rouge.
 */
export function classeTexteTeinte(t: TeintePrestation | TeinteCatalogue | null | undefined, sur: FondTexte = "papier"): string {
  const teinte = t && "teinte" in t ? t.teinte : t;
  if (teinte?.texteAutorise[sur]) return TEXTE_EN_TEINTE;
  return sur === "encre" ? "text-fond" : "text-encre";
}
