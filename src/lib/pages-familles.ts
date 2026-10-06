import revetements from "@/data/revetements.json";
import { inspirations, type AmbianceResolue } from "./ambiances";
import { FAMILLES } from "./familles-matieres";
import { referencesVedettes, vueDans } from "./indexation-matieres";
import { TIROIRS, type Matiere } from "./matieres";
import { trierParTeinte } from "./teintes";

/**
 * Les pages de famille (`/matieres/<famille>`, site 3.0, lot D3 ; énoncé, phase D) en règles pures, lues côté serveur
 * (testées : `src/app/matieres/familles.test.ts`) :
 *  - `SLUGS_FAMILLES` : les sept adresses, les identifiants de famille du catalogue (`bois`, `couleur`, `textile`,
 *    `pierre`, `metal`, `beton`, `paillettes`), stables : ce sont aussi ceux de `?famille=` et des fiches de D4
 *    (`/matieres/<famille>/<REF>`) ; rangées comme les tiroirs du présentoir, de la plus fournie à la moins fournie ;
 *  - `nuancierDeFamille` : toutes ses matières, rangées par teinte (`trierParTeinte`, comme le présentoir) ;
 *  - `degradeDeTeintes` : la bande de toutes ses teintes, en un seul `linear-gradient` à arrêts francs (aucune image,
 *    aucun nœud par teinte) ;
 *  - `ambiancesDeFamille` : trois ambiances de /inspirations où on la voit — celles où elle couvre la plus grande
 *    part des surfaces, une pièce différente d'abord ; aucune pour une famille jamais posée dans une ambiance ;
 *  - `vedettesDeFamille` : les vedettes du site (accueil, pages de prestation) de la famille, puis ses matières vues
 *    dans une ambiance (les plus vues d'abord), huit au plus ; complétées à quatre par des teintes prises à intervalles
 *    réguliers dans son nuancier (`completees` les compte : la page le dit).
 */

const CATALOGUE = revetements as Matiere[];

/** Les sept familles, de la plus fournie à la moins fournie (comme les tiroirs). */
export const SLUGS_FAMILLES: readonly string[] = FAMILLES.map((f) => f.id).sort((a, b) => CATALOGUE.filter((m) => m.famille === b).length - CATALOGUE.filter((m) => m.famille === a).length);

export const estSlugFamille = (slug: string) => SLUGS_FAMILLES.includes(slug);

/** Le nom d'une famille sur sa page : celui de son tiroir (« Bétons et stucs »). */
export const nomDeFamille = (id: string) => TIROIRS[id] ?? id;

/** Toutes les matières d'une famille, rangées par teinte. */
export function nuancierDeFamille<T extends Pick<Matiere, "famille" | "hex"> = Matiere>(famille: string, catalogue: readonly T[] = CATALOGUE as unknown as T[]): T[] {
  return trierParTeinte(catalogue.filter((m) => m.famille === famille));
}

/** La bande des teintes : un dégradé à arrêts francs, une bande égale par teinte, dans l'ordre reçu. */
export function degradeDeTeintes(hexes: readonly string[]): string {
  if (hexes.length === 0) return "none";
  if (hexes.length === 1) return hexes[0].toUpperCase();
  const pas = 100 / hexes.length;
  const arrondi = (x: number) => Number(x.toFixed(3));
  const arrets = hexes.map((hex, i) => `${hex.toUpperCase()} ${arrondi(i * pas)}% ${arrondi((i + 1) * pas)}%`);
  return `linear-gradient(90deg, ${arrets.join(", ")})`;
}

/** La part des surfaces d'une ambiance couvertes par la famille (0 à 1). */
const part = (a: AmbianceResolue, famille: string) => (a.surfaces.length ? a.surfaces.filter((s) => s.famille === famille).length / a.surfaces.length : 0);

/**
 * Trois ambiances (d'inspiration) où l'on voit la famille : la plus grande part de surfaces d'abord, puis l'ordre de
 * `data/ambiances` ; une pièce différente pour chacune tant que c'est possible. Liste vide : la page omet la section.
 */
export function ambiancesDeFamille(famille: string, nombre = 3, liste: readonly AmbianceResolue[] = inspirations()): AmbianceResolue[] {
  const candidates = liste
    .map((a, rang) => ({ a, rang, part: part(a, famille) }))
    .filter((c) => c.part > 0)
    .sort((x, y) => y.part - x.part || x.rang - y.rang)
    .map((c) => c.a);
  const retenues: AmbianceResolue[] = [];
  for (const a of candidates) if (retenues.length < nombre && !retenues.some((r) => r.piece === a.piece)) retenues.push(a);
  for (const a of candidates) if (retenues.length < nombre && !retenues.includes(a)) retenues.push(a);
  return retenues;
}

export const NB_VEDETTES_MAX = 8;
export const NB_VEDETTES_MIN = 4;

/**
 * Les vedettes d'une famille : celles du site d'abord (ordre de `referencesVedettes`), puis ses matières vues dans
 * une ambiance (les plus vues d'abord, puis l'ordre du catalogue), `NB_VEDETTES_MAX` au plus ; complétées jusqu'à
 * `NB_VEDETTES_MIN` par des teintes de son nuancier prises à intervalles réguliers (jamais deux fois la même).
 */
export function vedettesDeFamille<T extends Matiere>(famille: string, catalogue: readonly T[] = CATALOGUE as T[], vues: Record<string, readonly unknown[]> = vueDans(), vedettesSite: readonly string[] = referencesVedettes()): { matieres: T[]; completees: number } {
  const parId = new Map(catalogue.filter((m) => m.famille === famille).map((m) => [m.id, m]));
  const duSite = vedettesSite.filter((ref) => parId.has(ref));
  const vuesDansUneAmbiance = [...parId.keys()].filter((ref) => vues[ref]?.length && !duSite.includes(ref)).sort((a, b) => (vues[b]?.length ?? 0) - (vues[a]?.length ?? 0));
  const choisies = [...duSite, ...vuesDansUneAmbiance].slice(0, NB_VEDETTES_MAX).map((ref) => parId.get(ref)!);
  const manque = Math.max(0, Math.min(NB_VEDETTES_MIN, parId.size) - choisies.length);
  if (manque === 0) return { matieres: choisies, completees: 0 };
  const reste = nuancierDeFamille(famille, catalogue).filter((m) => !choisies.includes(m));
  const ajout = Array.from({ length: manque }, (_, i) => reste[Math.floor(((i + 0.5) * reste.length) / manque)]);
  return { matieres: [...choisies, ...ajout], completees: ajout.length };
}

/** Le nombre de mots d'un texte (un mot = une suite de lettres ou de chiffres, l'apostrophe comprise). */
export const compterMots = (texte: string) => (texte.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).length;
