/**
 * Les photos des cinq cartes de pièces (mission 16, partie 2) : UN seul
 * endroit, lu par le simulateur (`EcranPiece`), le module d'accueil
 * (`SimulationSection`) et, depuis la partie 5, les cartes de pièces de
 * `/realisations` et l'ouverture des pages par pièce (`ContenuPrestation`). Chaque valeur est un nom du manifeste
 * (`src/lib/images-manifeste.ts`) ; tant que l'image n'est pas préparée, la
 * carte garde son dessin au trait.
 *
 * INTÉRIM : ce sont des images d'AMBIANCE générées (étiquetées « Ambiance »
 * sur la carte), pas des réalisations. Les photos de réalisation des cinq
 * pièces restent à fournir par Lucas ; elles prendront ces places, sous
 * d'autres noms, le jour où elles existeront.
 *
 * L'espace client (`/e/*`) ne passe pas ces photos : ses cartes restent des
 * dessins (mission 15, inchangé).
 */
export type PieceId = "cuisine" | "salle-de-bain" | "meubles" | "mur-plafond" | "professionnel";

export const PHOTOS_PIECES: Readonly<Record<PieceId, string>> = {
  cuisine: "piece-cuisine",
  "salle-de-bain": "piece-salle-de-bain",
  meubles: "piece-meubles",
  "mur-plafond": "piece-murs",
  professionnel: "piece-pro",
};

/**
 * Le texte de chaque image d'ambiance de pièce, quand elle est une image de contenu (études simulées de l'accueil,
 * ouverture des pages par pièce, mission 16, parties 3 et 5) : il dit que c'est une image d'ambiance.
 */
export const ALT_PIECES: Readonly<Record<PieceId, string>> = {
  cuisine: "Cuisine rénovée au film, image d'ambiance",
  "salle-de-bain": "Salle de bain rénovée au film, image d'ambiance",
  meubles: "Meubles rénovés au film, image d'ambiance",
  "mur-plafond": "Mur habillé au film, image d'ambiance",
  professionnel: "Local professionnel rénové au film, image d'ambiance",
};

/** Le nom de la photo d'une pièce, s'il y en a une dans `photos` (un identifiant hérité d'`Object` n'en a pas). */
export function photoDePiece(photos: Partial<Record<PieceId, string>> | undefined, id: string): string | null {
  if (!photos || !Object.prototype.hasOwnProperty.call(photos, id)) return null;
  return photos[id as PieceId] ?? null;
}
