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
