import { AMBIANCES } from "@/data/ambiances";
import revetements from "@/data/revetements.json";
import { ambiances, type AmbianceResolue } from "./ambiances";
import { libelleFinition } from "./cartel";
import { estFamille } from "./familles-matieres";
import { estFicheIndexee, vueDans } from "./indexation-matieres";
import type { Matiere } from "./matieres";
import type { Publication } from "./publications";
import { matieresProches, teinteDe } from "./teintes";

/**
 * Les fiches de matière (`/matieres/<famille>/<REF>`, site 3.0, lot D4 ; énoncé, phase D) en règles pures, lues côté
 * serveur (testées : `src/app/matieres/fiches.test.ts`) :
 *  - `parametresDesFiches` : les 497 adresses, une par référence du catalogue, sous SA famille ;
 *  - `ficheDe` : la matière d'une adresse, ou `null` — une référence d'une autre famille (`/matieres/bois/K1`), une
 *    casse différente (`/matieres/bois/d1`, sans redirection) ou une référence inconnue donnent un 404 ;
 *  - `titreFiche` (60 caractères au plus), `descriptionFiche` (155 au plus) ;
 *  - `ambiancesDeLaFiche` : « Vue dans », toutes les ambiances des séries 1 et 2 où elle est posée (`vueDans`, la
 *    source unique `data/ambiances`), avec les surfaces qu'elle y couvre et les matières posées à côté ;
 *  - `realisationsDeLaMatiere` : les réalisations publiées par le CRM qui la portent (quand le CRM publiera les
 *    matières d'un chantier : aujourd'hui aucune), montrées AVANT les ambiances ;
 *  - `prochesDeLaFiche` : ses six voisines de teinte dans tout le catalogue (ΔE CIEDE2000, `lib/teintes`).
 * Indexation : `estFicheIndexee` (les 52 de `fichesIndexees`) ; les autres fiches sont servies en `noindex, follow`.
 */

const CATALOGUE = revetements as Matiere[];

/** Toutes les fiches : `{ famille, ref }`, dans l'ordre du catalogue (497). */
export function parametresDesFiches(catalogue: readonly Pick<Matiere, "id" | "famille">[] = CATALOGUE): { famille: string; ref: string }[] {
  return catalogue.filter((m) => estFamille(m.famille)).map((m) => ({ famille: m.famille, ref: m.id }));
}

/** La matière de l'adresse `/matieres/<famille>/<ref>` : la référence exacte, sous sa famille ; sinon `null` (404). */
export function ficheDe(famille: string, ref: string, catalogue: readonly Matiere[] = CATALOGUE): Matiere | null {
  return catalogue.find((m) => m.id === ref && m.famille === famille) ?? null;
}

/** Le mot qui suit « film adhésif » dans un titre ou une description : ce que cherchent les gens (« effet marbre », « bois »). */
const GENRE_DU_FILM: Readonly<Record<string, string>> = { bois: "bois", couleur: "uni", pierre: "effet pierre", beton: "effet béton", metal: "effet métal", textile: "effet textile", paillettes: "pailleté" };
export const genreDuFilm = (famille: string) => GENRE_DU_FILM[famille] ?? "décoratif";

export const LONGUEUR_MAX_TITRE = 60;
export const LONGUEUR_MAX_DESCRIPTION_FICHE = 155;

/** Le titre de l'onglet : le plus complet qui tient en 60 caractères. */
export function titreFiche(m: Pick<Matiere, "id" | "nom" | "famille">): string {
  const genre = genreDuFilm(m.famille);
  const candidats = [`${m.nom} ${m.id} : film adhésif ${genre} | CoverSwap`, `${m.nom} ${m.id}, adhésif ${genre} | CoverSwap`, `${m.nom} ${m.id} | CoverSwap`, `${m.id}, film adhésif ${genre} | CoverSwap`];
  return candidats.find((t) => t.length <= LONGUEUR_MAX_TITRE) ?? candidats[candidats.length - 1];
}

/** La description : le nom, la référence, le genre, la finition, où on l'a vue ; puis les deux actions. 155 caractères au plus. */
export function descriptionFiche(m: Pick<Matiere, "id" | "nom" | "famille" | "finition">, nombreAmbiances: number): string {
  const vue = nombreAmbiances > 1 ? `, vu dans ${nombreAmbiances} de nos ambiances` : nombreAmbiances === 1 ? ", vu dans une de nos ambiances" : "";
  const debut = `${m.nom} (${m.id}), film adhésif ${genreDuFilm(m.famille)} Cover Styl'`;
  const finition = `, finition ${libelleFinition(m.finition).toLowerCase()}`;
  const candidats = [
    `${debut}${finition}${vue}. Essayez-le sur la photo de votre pièce, ou voyez l'échantillon chez vous.`,
    `${debut}${vue}. Essayez-le sur la photo de votre pièce, ou voyez l'échantillon chez vous.`,
    `${debut}. Essayez-le sur votre photo, ou voyez l'échantillon chez vous.`,
  ];
  return candidats.find((d) => d.length <= LONGUEUR_MAX_DESCRIPTION_FICHE) ?? candidats[candidats.length - 1];
}

export type AmbianceDeLaFiche = {
  ambiance: AmbianceResolue;
  /** Les surfaces qu'elle y couvre (« Plan de travail », « Meubles bas et meubles hauts »). */
  ici: string;
  /** Les autres matières de l'ambiance, une fois chacune. */
  avec: { ref: string; nom: string; famille: string }[];
};

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** « Vue dans » : toutes les ambiances (d'inspiration, séries 1 et 2) où elle est posée, dans l'ordre de `data/ambiances`. */
export function ambiancesDeLaFiche(ref: string, liste = AMBIANCES): AmbianceDeLaFiche[] {
  const resolues = new Map(ambiances(liste).map((a) => [a.id, a]));
  return (vueDans(liste)[ref] ?? []).flatMap((v) => {
    const ambiance = resolues.get(v.id);
    if (!ambiance) return [];
    const ici = [...new Set(ambiance.surfaces.filter((s) => s.ref === ref).map((s) => s.surface))].join(" et ");
    const avec = [...new Map(ambiance.surfaces.filter((s) => s.ref !== ref).map((s) => [s.ref, { ref: s.ref, nom: s.nom, famille: s.famille }])).values()];
    return [{ ambiance, ici: majuscule(ici), avec }];
  });
}

/**
 * Relecture des phases D, E, F : les photos utiles (la pose, le chant en gros plan — ambiances `inspiration: false`)
 * où la matière apparaît. « Vue dans » les ignorait (AF02 sur `pose-mains`, RM20 sur `pose-sauge` et `detail-chant`) :
 * elles sont listées sur la fiche, « Ambiance », avec un lien vers /comment-ca-marche. Hors de `vueDans`, qui décide
 * de l'indexation : rien ne change au plan du site.
 */
export function photosUtilesDeLaFiche(ref: string, liste = AMBIANCES): Omit<AmbianceDeLaFiche, "avec">[] {
  return ambiances(liste)
    .filter((a) => !a.inspiration && a.surfaces.some((s) => s.ref === ref))
    .map((ambiance) => ({ ambiance, ici: majuscule([...new Set(ambiance.surfaces.filter((s) => s.ref === ref).map((s) => s.surface))].join(" et ")) }));
}

/**
 * Relecture des phases D, E, F : une ou trois phrases propres à la fiche, tirées de SES données — sa teinte dans les
 * filtres du catalogue et sa finition, l'ambiance où on l'a posée, ses deux plus proches voisines de teinte — sous la
 * note des fiches indexées (le reste de la page est commun à la famille). Rien d'autre que ce qu'on sait de la référence.
 */
export function resumeFiche(m: Pick<Matiere, "nom" | "famille" | "hex" | "finition">, vues: readonly Pick<AmbianceDeLaFiche, "ambiance" | "ici">[], proches: readonly Pick<Matiere, "id" | "nom">[]): string {
  const phrases = [`${m.nom} se range dans les teintes « ${teinteDe(m.famille, m.hex).toLowerCase()} » du catalogue, en finition ${libelleFinition(m.finition).toLowerCase()}.`];
  const [premiere] = vues;
  if (premiere) phrases.push(vues.length === 1 ? `On l'a posée en ${premiere.ici.toLowerCase()} dans « ${premiere.ambiance.titre} ».` : `On l'a posée dans ${vues.length} ambiances, dont « ${premiere.ambiance.titre} » (${premiere.ici.toLowerCase()}).`);
  if (proches.length >= 2) phrases.push(`Ses deux plus proches voisines de teinte : ${proches[0].nom} (${proches[0].id}) et ${proches[1].nom} (${proches[1].id}).`);
  return phrases.join(" ");
}

/** Les réalisations publiées qui portent la référence (avec une photo « après ») : elles passent avant les ambiances. */
export function realisationsDeLaMatiere(ref: string, realisations: readonly Publication[]): Publication[] {
  return realisations.filter((p) => p.type === "REALISATION" && !!p.photoApres && !!p.matieres?.some((m) => m.ref === ref));
}

export const NB_PROCHES = 6;

/** Ses six voisines de teinte dans tout le catalogue, la plus proche d'abord, avec leur écart (ΔE). */
export function prochesDeLaFiche(ref: string, catalogue: readonly Matiere[] = CATALOGUE) {
  return matieresProches(ref, catalogue, NB_PROCHES);
}

/** L'écart de teinte lisible : « 1,1 ». */
export const ecartLisible = (deltaE: number) => deltaE.toFixed(1).replace(".", ",");

export { estFicheIndexee };
