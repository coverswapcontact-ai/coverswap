/**
 * Les familles du catalogue Cover Styl' (mission 15, partie 4 ; sorties de
 * `simulation/FeuilleCatalogue.tsx` par la mission 16) : UNE liste pour le
 * simulateur, l'espace client et la page Matières. Module sans « use client »
 * ni dépendance : une page ou un composant serveur peut la lire sans tirer
 * le catalogue en feuille dans son JavaScript. `FeuilleCatalogue` la
 * réexporte (ses importeurs ne changent pas).
 */
export const FAMILLES = [
  { id: "bois", libelle: "Bois" },
  { id: "couleur", libelle: "Couleurs" },
  { id: "pierre", libelle: "Pierre" },
  { id: "beton", libelle: "Béton" },
  { id: "metal", libelle: "Métal" },
  { id: "textile", libelle: "Textile" },
  { id: "paillettes", libelle: "Paillettes" },
];

export const libelleFamille = (id: string) => FAMILLES.find((f) => f.id === id)?.libelle ?? id;

/** `id` est-il une famille du catalogue (une adresse `?famille=` inconnue ne filtre rien) ? */
export const estFamille = (id: string | null | undefined): id is string => !!id && FAMILLES.some((f) => f.id === id);

/**
 * Site 3.0 (lot D3) : l'adresse de la page d'une famille (`/matieres/bois`). Les identifiants de famille sont les
 * adresses, stables (`?famille=`, et les fiches de D4 sous `/matieres/<famille>/<REF>`).
 */
export const cheminFamille = (id: string) => `/matieres/${id}`;

/**
 * Le nom d'un tiroir du présentoir (site 3.0, lot D2 ; énoncé, phase D) : la famille au pluriel, comme sur un meuble
 * d'échantillons. Les filtres du simulateur gardent leurs libellés (`FAMILLES`). Lot D4 : déplacé ici (module léger,
 * lu par le formulaire de contact) ; `lib/matieres` le réexporte.
 */
export const TIROIRS: Readonly<Record<string, string>> = { bois: "Bois", couleur: "Couleurs", textile: "Textiles", pierre: "Pierres", metal: "Métaux", beton: "Bétons et stucs", paillettes: "Paillettes" };

/**
 * Site 3.0 (lot D4) : l'adresse d'une matière, LA règle des liens vers une matière (`lienMatiere` de
 * `lib/matieres-vedettes` la suit en lisant la famille dans le catalogue ; le calque des ambiances, côté client, la
 * suit avec la famille qu'il connaît déjà). Avec une famille du catalogue : sa fiche, `/matieres/<famille>/<REF>`
 * (la référence telle quelle, en majuscules) ; sans famille connue : le présentoir ouvert sur elle, `/matieres?ref=`,
 * qui reste servi.
 */
export function cheminMatiere(ref: string, famille?: string | null): string {
  return estFamille(famille) ? `${cheminFamille(famille)}/${encodeURIComponent(ref)}` : `/matieres?ref=${encodeURIComponent(ref)}`;
}
