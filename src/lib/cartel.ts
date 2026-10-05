import { libelleFamille } from "./familles-matieres";

/**
 * Le cartel d'une matière (site 3.0, lot B3), comme l'étiquette d'un échantillon en boutique :
 * « Nom · RÉF · famille · finition » (« Sage Green · RM20 · Couleur · Standard »). Fonctions pures, lues par
 * `components/revue/Cartel`, la bande de matière et l'échantillon ; testées par `components/revue/revue.test.ts`.
 *
 * Le catalogue Cover Styl' nomme ses matières et ses finitions en anglais : le nom reste celui du fabricant (c'est
 * lui qu'on retrouve sur l'échantillon), la famille et la finition sont dites en français.
 */
export type MatiereCartel = { id: string; nom: string; famille: string; finition?: string; hex?: string };

/** La famille au singulier, comme sur un cartel (« Couleur · RM20 ») ; les filtres gardent le pluriel (« Couleurs »). */
const FAMILLE_AU_SINGULIER: Readonly<Record<string, string>> = { couleur: "Couleur" };

/**
 * Les quatre finitions du catalogue, glosées en français. 474 matières sur 497 sont « Soft », la finition courante
 * du fabricant (mate ou laquée selon la matière) : « Standard ».
 */
export const FINITIONS: Readonly<Record<string, string>> = { Soft: "Standard", Structured: "Structurée", Rustic: "Rustique", Glitter: "Pailletée" };

export const libelleFinition = (finition: string) => FINITIONS[finition] ?? finition;

export const familleDuCartel = (famille: string) => FAMILLE_AU_SINGULIER[famille] ?? libelleFamille(famille);

/** Ce qui suit le nom : « RM20 · Couleur · Standard » (la finition seulement si elle est connue). */
export function ligneCartel(m: MatiereCartel): string {
  return [m.id, familleDuCartel(m.famille), m.finition ? libelleFinition(m.finition) : null].filter(Boolean).join(" · ");
}

/** Le cartel entier, en une ligne : « Sage Green · RM20 · Couleur · Standard » (texte d'une image, aria-label). */
export function texteCartel(m: MatiereCartel): string {
  return `${m.nom} · ${ligneCartel(m)}`;
}
