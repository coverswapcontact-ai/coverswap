import { FAMILLES, estFamille, libelleFamille } from "./familles-matieres";
import { referenceDeLAdresse } from "./matieres-vedettes";
import { correspondRecherche } from "./recherche-finitions";

/**
 * La page Matières (mission 16, partie 5) en règles pures, testées (`matieres.test.ts`) : le catalogue Cover Styl'
 * (`src/data/revetements.json`), ses familles et leurs comptes, le filtre (famille, favoris, recherche en français),
 * ce que l'adresse demande (`?famille=`, `?ref=`) et le lien « Essayer sur ma photo » (`/simulateur?ref=`, lu par
 * le simulateur depuis la partie 4).
 *
 * Le catalogue ENTIER n'est chargé par le navigateur qu'à la demande (`chargerCatalogue`, un fichier à part, gardé en
 * mémoire) : la page en rend les 30 premières matières côté serveur (référencement), le reste suit. Le catalogue en
 * feuille du simulateur et de l'espace (`FeuilleCatalogue`) lit la même copie.
 */

export type Matiere = { id: string; nom: string; famille: string; categorie: string; finition: string; image: string; tags: string[]; /** La couleur moyenne de l'échantillon (« #RRGGBB ») : le nuancier (`lib/teintes`), la place réservée d'une vignette. */ hex: string };

/** Les matières rendues par lot (« Voir plus ») ; le premier lot est rendu par le serveur. */
export const MATIERES_PAR_PAGE = 30;

/** Mission 16 (partie 6) : le filtrage suit la frappe 150 ms après la dernière touche (INP), le champ tout de suite. */
export const DELAI_RECHERCHE_MS = 150;

export type FiltreMatieres = "tout" | "favoris" | string;

let catalogueEnMemoire: Matiere[] | null = null;

/** Le catalogue, chargé une fois (import dynamique : il ne pèse rien sur l'ouverture de la page). */
export async function chargerCatalogue(): Promise<Matiere[]> {
  if (!catalogueEnMemoire) catalogueEnMemoire = (await import("@/data/revetements.json")).default as Matiere[];
  return catalogueEnMemoire;
}

/** Le catalogue s'il est déjà en mémoire (une page déjà visitée l'a chargé), sinon `null`. */
export function catalogueEnMemoireSiCharge(): Matiere[] | null {
  return catalogueEnMemoire;
}

export type ChoixFamille = { id: string; libelle: string; nombre: number };

/** « Tout » puis les familles du simulateur, chacune avec son nombre de références (compté dans les données). */
export function choixFamilles(catalogue: readonly Pick<Matiere, "famille">[]): ChoixFamille[] {
  return [{ id: "tout", libelle: "Tout", nombre: catalogue.length }, ...FAMILLES.map((f) => ({ id: f.id, libelle: f.libelle, nombre: catalogue.filter((m) => m.famille === f.id).length }))];
}

/** Les matières qui répondent au filtre (famille ou favoris) et à la recherche, dans l'ordre du catalogue. */
export function filtrerMatieres<T extends Matiere>(catalogue: readonly T[], { filtre, recherche = "", favoris = [] }: { filtre: FiltreMatieres; recherche?: string; favoris?: readonly string[] }): T[] {
  const q = recherche.trim();
  return catalogue.filter((m) => {
    if (filtre === "favoris" && !favoris.includes(m.id)) return false;
    if (filtre !== "tout" && filtre !== "favoris" && m.famille !== filtre) return false;
    return !q || correspondRecherche(m, q);
  });
}

/**
 * Le message d'une liste vide, le même dans la page Matières et le catalogue en feuille : pas encore de favori (le
 * geste pour en garder un), sinon aucune correspondance (des recherches qui marchent). `chose` : ce que l'écran
 * appelle une tuile (« matière » sur la page, « échantillon » dans la feuille).
 */
export function messageAucuneMatiere(filtre: FiltreMatieres, recherche: string, chose: "matière" | "échantillon" = "matière"): string {
  if (filtre === "favoris" && !recherche) return chose === "matière" ? "Pas encore de favori : touchez le cœur d'une matière pour la garder ici." : "Pas encore de favori : touchez le cœur d'un échantillon pour le garder ici.";
  return "Aucune matière ne correspond. Essayez « bois clair », « blanc » ou « marbre ».";
}

export type EtatListeMatieres<T> = { visibles: T[]; attend: boolean; reste: number; echec: boolean; message: string };

/**
 * Ce que la liste de la page Matières montre, selon ce qui est arrivé (`filtrees` : le catalogue filtré, `null` tant
 * qu'il n'est pas là) :
 *  - avant le catalogue : le premier lot du serveur pour « Tout » sans recherche, compté au nombre de la famille
 *    (« Voir plus » l'annonce déjà) ; tout autre filtre attend (`attend` : le squelette) ;
 *  - catalogue en ÉCHEC : seulement ce qui est là — le compte des matières affichées (jamais le total du
 *    catalogue), le message d'échec même quand le premier lot est visible, et pas de « Voir plus » ;
 *  - catalogue arrivé : le compte filtré, ou le message d'une liste vide.
 */
export function etatListeMatieres<T>({ filtrees, probleme, filtre, recherche, premieres, familles, limite }: { filtrees: readonly T[] | null; probleme: boolean; filtre: FiltreMatieres; recherche: string; premieres: readonly T[]; familles: readonly ChoixFamille[]; limite: number }): EtatListeMatieres<T> {
  const q = recherche.trim();
  const echec = probleme && !filtrees;
  const attend = !filtrees && !probleme && (filtre !== "tout" || q !== "" || limite > premieres.length);
  const liste = filtrees ?? (filtre === "tout" && !q ? premieres : []);
  const total = filtrees ? filtrees.length : echec ? liste.length : (familles.find((f) => f.id === filtre)?.nombre ?? liste.length);
  const reste = echec ? 0 : Math.max(0, total - Math.min(limite, total));
  const libelleFiltre = filtre === "favoris" ? "vos favoris" : filtre !== "tout" ? libelleFamille(filtre) : null;
  const message = echec
    ? liste.length === 0
      ? "Le catalogue ne s'est pas chargé. Vérifiez votre réseau, puis rechargez la page."
      : `Le reste du catalogue ne s'est pas chargé (${total} matières affichées). Vérifiez votre réseau, puis rechargez la page.`
    : filtrees && filtrees.length === 0
      ? messageAucuneMatiere(filtre, recherche)
      : `${total} matière${total > 1 ? "s" : ""}${libelleFiltre ? ` dans ${libelleFiltre}` : ""}${q ? ` pour « ${q} »` : ""}`;
  return { visibles: liste.slice(0, limite), attend, reste, echec, message };
}

/**
 * Ce que l'adresse demande (`?famille=bois`, `?ref=K1`, tuiles de l'accueil, matières d'une réalisation) :
 *  - `ouverte` : la matière de `?ref=` si elle est au catalogue, sinon rien (une référence inconnue n'ouvre rien) ;
 *  - `famille` : `?famille=` si c'est une famille du catalogue, sinon celle de la matière demandée, sinon « tout »
 *    (une famille inconnue ne filtre rien).
 * Sans catalogue (pas encore chargé), `ouverte` est `null` : la page relit l'adresse quand il arrive.
 */
export function lireAdresseMatieres<T extends Pick<Matiere, "id" | "famille">>(recherche: string, catalogue: readonly T[] | null): { famille: string; ouverte: T | null } {
  const parametres = new URLSearchParams(recherche);
  const ouverte = catalogue ? referenceDeLAdresse(parametres.get("ref"), catalogue) : null;
  const demandee = parametres.get("famille");
  const famille = estFamille(demandee) ? demandee : ouverte && estFamille(ouverte.famille) ? ouverte.famille : "tout";
  return { famille, ouverte };
}

/** « Essayer sur ma photo » : le simulateur, la matière présélectionnée (posée sur la première zone de la pièce). */
export function lienEssayer(ref: string): string {
  return `/simulateur?ref=${encodeURIComponent(ref)}`;
}
