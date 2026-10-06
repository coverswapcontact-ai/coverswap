import { AMBIANCES, type Ambiance, type PieceAmbiance } from "@/data/ambiances";
import { CAS_PRESTATIONS } from "@/data/cas-prestations";
import revetements from "@/data/revetements.json";
import { MATIERES_VEDETTES } from "./matieres-vedettes";

/**
 * Où l'on voit une matière, et quelles fiches de matière le site donne à indexer (site 3.0, lot D1 ; énoncé, phase D,
 * « Indexation »). Fonctions pures, lues côté serveur (page Matières, familles, fiches, plan du site) ; testées par
 * `teintes.test.ts`.
 *
 *  - `vueDans` : pour chaque référence, les ambiances de /inspirations où elle est posée, séries 1 et 2 réunies (la
 *    source unique, `data/ambiances`). Une photo d'étape ou une photo utile (`inspiration: false`) ne compte pas :
 *    AF02, vue seulement dans `pose-mains`, n'a pas de « Vue dans ».
 *  - `fichesIndexees` : les fiches que le plan du site et les moteurs reçoivent — toutes les matières vues dans une
 *    ambiance (49), plus les vedettes (accueil et pages de prestation) qui n'y sont pas (NF27, J3, Q1) : 52. L'énoncé
 *    disait « 40 matières vedettes, celles qui apparaissent dans une ambiance » ; on les prend toutes plutôt que d'en
 *    écarter neuf au hasard. Les 445 autres fiches sont servies en `noindex, follow`.
 *  - `prestationsDeFamille` : les pages de prestation où une famille se pose (liens d'une famille et d'une fiche).
 */

type Reference = { id: string; famille: string };
const CATALOGUE = revetements as Reference[];

export type VueDans = { id: string; titre: string; image: string; piece: PieceAmbiance };

/** « Vue dans » : pour chaque référence, les ambiances (d'inspiration) où elle apparaît, dans l'ordre de `data/ambiances`. */
export function vueDans(liste: readonly Ambiance[] = AMBIANCES): Record<string, VueDans[]> {
  const parRef: Record<string, VueDans[]> = {};
  for (const a of liste) {
    if (!a.inspiration) continue;
    for (const s of a.surfaces) {
      const deja = (parRef[s.ref] ??= []);
      if (!deja.some((x) => x.id === a.id)) deja.push({ id: a.id, titre: a.titre, image: a.image, piece: a.piece });
    }
  }
  return parRef;
}

/** Les références mises en avant : les huit de l'accueil et les vedettes des pages de prestation. */
export function referencesVedettes(): string[] {
  return [...new Set([...MATIERES_VEDETTES.map((v) => v.ref), ...Object.values(CAS_PRESTATIONS).flatMap((c) => c.vedettes)])];
}

/**
 * Les fiches indexées : les matières vues dans une ambiance et les vedettes, dans l'ordre du catalogue (une référence
 * qui n'y est plus n'a pas de fiche).
 */
export function fichesIndexees(liste: readonly Ambiance[] = AMBIANCES, catalogue: readonly Reference[] = CATALOGUE): string[] {
  const retenues = new Set([...Object.keys(vueDans(liste)), ...referencesVedettes()]);
  return catalogue.filter((m) => retenues.has(m.id)).map((m) => m.id);
}

const INDEXEES = new Set(fichesIndexees());

/** La fiche de cette référence va-t-elle au plan du site (sinon `noindex, follow`) ? */
export const estFicheIndexee = (ref: string) => INDEXEES.has(ref);

export type PrestationDeFamille = { slug: "cuisine" | "salle-de-bain" | "meubles" | "professionnel"; libelle: string; href: string };

const CUISINE: PrestationDeFamille = { slug: "cuisine", libelle: "Cuisine", href: "/prestations/cuisine" };
const SALLE_DE_BAIN: PrestationDeFamille = { slug: "salle-de-bain", libelle: "Salle de bain", href: "/prestations/salle-de-bain" };
const MEUBLES: PrestationDeFamille = { slug: "meubles", libelle: "Meubles", href: "/prestations/meubles" };
const PRO: PrestationDeFamille = { slug: "professionnel", libelle: "Professionnels", href: "/pro" };

/**
 * Où une famille se pose : bois, couleurs, pierres et bétons partout (cuisine, salle de bain, meubles) ; métaux,
 * textiles et paillettes sur un meuble ou dans un local (pas sur un plan de travail ni près de l'eau). Une famille
 * inconnue : rien.
 */
export function prestationsDeFamille(famille: string): PrestationDeFamille[] {
  if (["bois", "couleur", "pierre", "beton"].includes(famille)) return [CUISINE, SALLE_DE_BAIN, MEUBLES];
  if (["metal", "textile", "paillettes"].includes(famille)) return [MEUBLES, PRO];
  return [];
}
