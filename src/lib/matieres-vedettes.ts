import revetements from "@/data/revetements.json";
import type { MatiereCartel } from "./cartel";

/**
 * Les huit matières montrées sur l'accueil (mission 16, partie 3) : huit
 * références RÉELLES du catalogue Cover Styl' (`src/data/revetements.json`),
 * une par famille d'usage — bois clair, bois foncé, noir mat, blanc mat,
 * marbre, béton, métal, couleur. Chaque tuile mène à `/matieres?ref=<ref>`.
 * `familleCatalogue` est la famille de la référence dans le catalogue (le test
 * vérifie qu'elle n'a pas changé) ; `libelle`, le mot montré sur la tuile.
 */
export type FamilleVedette = "bois-clair" | "bois-fonce" | "noir-mat" | "blanc-mat" | "marbre" | "beton" | "metal" | "couleur";

export type Vedette = { ref: string; famille: FamilleVedette; libelle: string; familleCatalogue: string };

export const MATIERES_VEDETTES: readonly Vedette[] = [
  { ref: "NF27", famille: "bois-clair", libelle: "Bois clair", familleCatalogue: "bois" },
  { ref: "D1", famille: "bois-fonce", libelle: "Bois foncé", familleCatalogue: "bois" },
  { ref: "K1", famille: "noir-mat", libelle: "Noir mat", familleCatalogue: "couleur" },
  { ref: "J3", famille: "blanc-mat", libelle: "Blanc mat", familleCatalogue: "couleur" },
  { ref: "NE31", famille: "marbre", libelle: "Marbre", familleCatalogue: "pierre" },
  { ref: "NE24", famille: "beton", libelle: "Béton", familleCatalogue: "beton" },
  { ref: "Q1", famille: "metal", libelle: "Métal", familleCatalogue: "metal" },
  { ref: "RM20", famille: "couleur", libelle: "Vert sauge", familleCatalogue: "couleur" },
];

type Reference = { id: string; nom: string; famille: string };

/** Les vedettes avec leur nom lu dans le catalogue ; une référence disparue du catalogue n'est pas montrée. */
export function matieresVedettes(catalogue: readonly Reference[] = revetements as Reference[]): (Vedette & { nom: string })[] {
  const parId = new Map(catalogue.map((r) => [r.id, r]));
  return MATIERES_VEDETTES.flatMap((v) => {
    const r = parId.get(v.ref);
    return r ? [{ ...v, nom: r.nom }] : [];
  });
}

/** L'adresse de la page Matières ouverte sur une référence (le catalogue la relit : `referenceDeLAdresse`). */
export function lienMatiere(ref: string): string {
  return `/matieres?ref=${encodeURIComponent(ref)}`;
}

/**
 * La référence demandée par l'adresse de la page Matières (`?ref=K1`, tuiles de l'accueil et matières d'une
 * réalisation) : celle du catalogue, ou `null` (absente, inconnue). `CatalogueClient` ouvre sa fiche et filtre sa
 * famille.
 */
export function referenceDeLAdresse<T extends { id: string }>(ref: string | null | undefined, catalogue: readonly T[]): T | null {
  const id = ref?.trim();
  if (!id) return null;
  return catalogue.find((r) => r.id === id) ?? null;
}

/**
 * Site 3.0 (lot B6) : le cartel d'une référence lu dans le catalogue (nom, famille, finition, couleur), pour un
 * échantillon, une bande de matière ou la légende d'une ambiance ; `null` si elle n'y est plus. Côté serveur : le
 * catalogue entier ne part pas dans le navigateur.
 */
export function matiereCartel(ref: string, catalogue: readonly (Reference & { finition?: string; hex?: string })[] = revetements as (Reference & { finition?: string; hex?: string })[]): MatiereCartel | null {
  const r = catalogue.find((x) => x.id === ref);
  return r ? { id: r.id, nom: r.nom, famille: r.famille, ...(r.finition ? { finition: r.finition } : {}), ...(r.hex ? { hex: r.hex.toUpperCase() } : {}) } : null;
}
