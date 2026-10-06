import { FINITIONS } from "./cartel";
import { FAMILLES, TIROIRS, estFamille, libelleFamille } from "./familles-matieres";
import { referenceDeLAdresse } from "./matieres-vedettes";
import { correspondRecherche } from "./recherche-finitions";
import { teinteDe, trierParTeinte, type Teinte } from "./teintes";

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

/** Le nom d'un tiroir du présentoir (lot D2) : `lib/familles-matieres` depuis le lot D4, réexporté ici. */
export { TIROIRS } from "./familles-matieres";

/** Un tiroir : sa famille, son nom, son nombre de références et quatre teintes de son nuancier (pastilles CSS). */
export type Tiroir = ChoixFamille & { teintes: string[] };

/**
 * Les tiroirs du présentoir : « Tout », puis les sept familles de la plus fournie à la moins fournie (bois 267,
 * couleurs 89, textiles 41, pierres 36, métaux 31, bétons et stucs 17, paillettes 16), chacune avec quatre teintes
 * prises à intervalles réguliers dans son nuancier (`trierParTeinte`) ; « Tout » montre une teinte des quatre plus
 * grandes familles.
 */
export function tiroirs(catalogue: readonly Pick<Matiere, "famille" | "hex">[]): Tiroir[] {
  const echantillonner = (liste: readonly Pick<Matiere, "hex">[], nombre = 4) => {
    const rangee = trierParTeinte(liste);
    return rangee.length ? Array.from({ length: nombre }, (_, i) => rangee[Math.floor(((i + 0.5) * rangee.length) / nombre)].hex.toUpperCase()) : [];
  };
  const familles = choixFamilles(catalogue)
    .slice(1)
    .map((f) => ({ ...f, libelle: TIROIRS[f.id] ?? f.libelle, teintes: echantillonner(catalogue.filter((m) => m.famille === f.id)) }))
    .sort((a, b) => b.nombre - a.nombre);
  const tout = familles.slice(0, 4).map((f) => f.teintes[1] ?? f.teintes[0]);
  return [{ id: "tout", libelle: "Tout", nombre: catalogue.length, teintes: tout }, ...familles];
}

/**
 * Les finitions du filtre : celles qui ne sont pas « Standard » (Soft, 474 matières sur 497 : la proposer ne filtrerait
 * presque rien), glosées en français, avec leur nombre — Structurée, Rustique, Pailletée.
 */
export function choixFinitions(catalogue: readonly Pick<Matiere, "finition">[]): { id: string; libelle: string; nombre: number }[] {
  return Object.keys(FINITIONS)
    .filter((id) => id !== "Soft")
    .map((id) => ({ id, libelle: FINITIONS[id], nombre: catalogue.filter((m) => m.finition === id).length }))
    .filter((f) => f.nombre > 0);
}

/** Ce qui affine la liste au-delà de la famille et de la recherche (site 3.0, lot D2). */
export type Affinage = {
  /** Une teinte du filtre (`lib/teintes › teinteDe`), ou rien. */
  teinte?: Teinte | null;
  /** Une finition du catalogue (« Structured »…), ou rien. */
  finition?: string | null;
  /** « Vue dans une ambiance » : les références vues dans une ambiance, ou rien (pas de filtre). */
  ambiance?: readonly string[] | null;
};

/** Un affinage est-il choisi ? */
export const estAffine = ({ teinte, finition, ambiance }: Affinage) => !!teinte || !!finition || !!ambiance;

/**
 * Les matières qui répondent au filtre (famille ou favoris), à la recherche et à l'affinage (teinte, finition, vue dans
 * une ambiance), dans l'ordre du catalogue. Le présentoir les range ensuite par teinte (`trierParTeinte`), HORS du
 * filtre : la feuille du simulateur garde l'ordre du catalogue.
 */
export function filtrerMatieres<T extends Matiere>(catalogue: readonly T[], { filtre, recherche = "", favoris = [], teinte = null, finition = null, ambiance = null }: { filtre: FiltreMatieres; recherche?: string; favoris?: readonly string[] } & Affinage): T[] {
  const q = recherche.trim();
  const vues = ambiance ? new Set(ambiance) : null;
  return catalogue.filter((m) => {
    if (filtre === "favoris" && !favoris.includes(m.id)) return false;
    if (filtre !== "tout" && filtre !== "favoris" && m.famille !== filtre) return false;
    if (teinte && teinteDe(m.famille, m.hex) !== teinte) return false;
    if (finition && m.finition !== finition) return false;
    if (vues && !vues.has(m.id)) return false;
    return !q || correspondRecherche(m, q);
  });
}

/**
 * Le message d'une liste vide, le même dans la page Matières et le catalogue en feuille : pas encore de favori (le
 * geste pour en garder un), sinon aucune correspondance (des recherches qui marchent). `chose` : ce que l'écran
 * appelle une tuile (« matière » sur la page, « échantillon » dans la feuille).
 */
export function messageAucuneMatiere(filtre: FiltreMatieres, recherche: string, chose: "matière" | "échantillon" = "matière", affine = false): string {
  if (affine) return "Aucune matière pour ce choix : enlevez un filtre ou ouvrez un autre tiroir.";
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
export function etatListeMatieres<T>({ filtrees, probleme, filtre, recherche, premieres, familles, limite, affine = false, precisions = [] }: { filtrees: readonly T[] | null; probleme: boolean; filtre: FiltreMatieres; recherche: string; premieres: readonly T[]; familles: readonly ChoixFamille[]; limite: number; /** Un affinage (teinte, finition, ambiance) est choisi : comme une recherche, il attend le catalogue. */ affine?: boolean; /** L'affinage dit dans le compte (« Bois clair », « vues dans une ambiance »). */ precisions?: readonly string[] }): EtatListeMatieres<T> {
  const q = recherche.trim();
  const echec = probleme && !filtrees;
  const brut = filtre === "tout" && !q && !affine;
  const attend = !filtrees && !probleme && (!brut || limite > premieres.length);
  const liste = filtrees ?? (brut ? premieres : []);
  const total = filtrees ? filtrees.length : echec ? liste.length : (familles.find((f) => f.id === filtre)?.nombre ?? liste.length);
  const reste = echec ? 0 : Math.max(0, total - Math.min(limite, total));
  const libelleFiltre = filtre === "favoris" ? "vos favoris" : filtre !== "tout" ? libelleFamille(filtre) : null;
  const message = echec
    ? liste.length === 0
      ? "Le catalogue ne s'est pas chargé. Vérifiez votre réseau, puis rechargez la page."
      : `Le reste du catalogue ne s'est pas chargé (${total} matières affichées). Vérifiez votre réseau, puis rechargez la page.`
    : filtrees && filtrees.length === 0
      ? messageAucuneMatiere(filtre, recherche, "matière", affine)
      : `${total} matière${total > 1 ? "s" : ""}${libelleFiltre ? ` dans ${libelleFiltre}` : ""}${precisions.length ? ` (${precisions.join(", ")})` : ""}${q ? ` pour « ${q} »` : ""}`;
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

/**
 * « Essayer sur ma photo » : le simulateur, la matière présélectionnée (posée sur la première zone de la pièce). Site
 * 3.0 : `depuis` dit d'où vient le lien (`matieres`, puis `matiere-fiche` ; repris dans `PIECE_CHOISIE`,
 * `docs/SUIVI.md`). Sans `depuis`, l'adresse ne change pas.
 */
export function lienEssayer(ref: string, depuis?: string): string {
  return `/simulateur?ref=${encodeURIComponent(ref)}${depuis ? `&depuis=${encodeURIComponent(depuis)}` : ""}`;
}

/** Le premier lot du présentoir, rendu par le serveur : le catalogue rangé par teinte (`trierParTeinte`), 30 matières. */
export function premieresDuPresentoir<T extends Pick<Matiere, "hex">>(catalogue: readonly T[]): T[] {
  return trierParTeinte(catalogue).slice(0, MATIERES_PAR_PAGE);
}
