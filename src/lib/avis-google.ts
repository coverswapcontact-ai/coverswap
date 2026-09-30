/**
 * Les avis Google (mission 16, partie 3) : la note, le nombre d'avis et
 * quelques extraits, lus par le CRM chez Google (Places API, cache de 24 h sur
 * son volume) et servis par `GET <CRM>/api/site/avis-google`. Le site relit
 * toutes les heures. AUCUN chiffre n'est écrit ici : sans connexion (clé ou
 * lieu absents côté CRM), sans note ou sans nombre, le bloc « Note Google »
 * n'existe pas (`blocAvis` rend `null`).
 *
 * Attribution exigée par les règles de la Places API (« You must always
 * credit the author when displaying photos or reviews ») : chaque extrait
 * porte le nom de l'auteur TEL QUE Google le donne, en lien vers son profil,
 * son avatar, et un lien vers l'avis sur Google Maps ; le bloc porte la
 * mention « Google Maps » et dit comment les avis sont choisis. Liens et
 * avatar en `https:` seulement (vérifié ici aussi : ce sont des adresses
 * écrites dans la page).
 */
export type AvisGoogle = {
  /** Le nom de l'auteur tel que Google le donne. */
  auteur: string;
  /** Son profil Google Maps, son avatar, l'avis sur Google Maps (`https:`, sinon null). */
  lienAuteur: string | null;
  photoAuteur: string | null;
  lienAvis: string | null;
  note: number | null;
  texte: string;
  date: string | null;
};

export type BlocAvis = { note: number; nombre: number; avis: AvisGoogle[] };

/** Extraits montrés au plus. */
export const EXTRAITS_MAX = 3;

/** Comment les extraits sont choisis (règle de Google : dire l'ordre et le filtre appliqués). */
export const ORDRE_AVIS = "Extraits : les avis jugés les plus pertinents par Google, parmi ceux qui ont un texte.";

const BASE_CRM = (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "");

/** La réponse brute du CRM (`{ disponible, note, nombre, avis }`), ou `null` s'il ne répond pas. Cache d'une heure. */
export async function chargerAvisGoogle(): Promise<unknown> {
  try {
    const reponse = await fetch(`${BASE_CRM}/api/site/avis-google`, { next: { revalidate: 3600 } });
    if (!reponse.ok) return null;
    return await reponse.json();
  } catch (erreur) {
    console.error("[avis-google] CRM injoignable :", erreur);
    return null;
  }
}

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const texteNonVide = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** Une adresse `https:`, sinon null (jamais un `javascript:` dans un lien ni un `http:` dans une image). */
export function lienHttps(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  try {
    const url = new URL(valeur);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function lireAvis(brut: unknown): AvisGoogle | null {
  if (!estObjet(brut) || !texteNonVide(brut.auteur) || !texteNonVide(brut.texte)) return null;
  const note = typeof brut.note === "number" && Number.isInteger(brut.note) && brut.note >= 1 && brut.note <= 5 ? brut.note : null;
  const date = texteNonVide(brut.date) && !Number.isNaN(Date.parse(brut.date)) ? brut.date : null;
  return { auteur: brut.auteur.trim(), lienAuteur: lienHttps(brut.lienAuteur), photoAuteur: lienHttps(brut.photoAuteur), lienAvis: lienHttps(brut.lienAvis), note, texte: brut.texte.trim(), date };
}

/**
 * Le bloc « Note Google », ou `null` : il n'existe QUE si la réponse porte une note (entre 1 et 5) ET un nombre
 * d'avis (entier ≥ 1). Les extraits valides (auteur et texte) sont gardés, trois au plus.
 */
export function blocAvis(donnees: unknown): BlocAvis | null {
  if (!estObjet(donnees)) return null;
  const { note, nombre } = donnees;
  if (typeof note !== "number" || !Number.isFinite(note) || note < 1 || note > 5) return null;
  if (typeof nombre !== "number" || !Number.isInteger(nombre) || nombre < 1) return null;
  const avis = (Array.isArray(donnees.avis) ? donnees.avis : []).map(lireAvis).filter((a): a is AvisGoogle => a !== null).slice(0, EXTRAITS_MAX);
  return { note, nombre, avis };
}

/** « 4,9 » : la note à la française, une décimale au plus. */
export function formaterNote(note: number): string {
  return note.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

/** « septembre 2026 » : le mois de l'avis (jamais le jour, jamais l'heure). */
export function formaterMoisAvis(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });
}
