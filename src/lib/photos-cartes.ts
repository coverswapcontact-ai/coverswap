import { matieresDeLImage } from "@/components/ambiances/PastillesMatieres";
import type { MatierePastille } from "@/components/ambiances/Pastilles";
import { photoDePiece, type PieceId } from "./images-pieces";
import { sourcesPhoto, type SourcesPhoto } from "./images-preparees";

/**
 * La photo d'une carte de pièce, résolue côté serveur (site 3.0, lot F7) : ses sources (le manifeste des images) et les
 * matières de ses pastilles (les ambiances). Les cartes de pièces (`CartesPieces`) sont rendues dans le navigateur par
 * le simulateur : en recevant ces données toutes prêtes de leur page, elles n'emportent ni le manifeste ni les
 * ambiances dans le JavaScript du simulateur. Une photo absente du manifeste n'est pas rendue : la carte garde son
 * pictogramme (comme avant).
 */
export type PhotoCarte = { sources: SourcesPhoto; matieres: MatierePastille[] };

export function photosDesCartes(photos: Readonly<Partial<Record<PieceId, string>>>): Partial<Record<PieceId, PhotoCarte>> {
  const sortie: Partial<Record<PieceId, PhotoCarte>> = {};
  for (const id of Object.keys(photos) as PieceId[]) {
    const nom = photoDePiece(photos, id);
    const sources = nom ? sourcesPhoto(nom) : null;
    if (!nom || !sources) continue;
    sortie[id] = { sources, matieres: matieresDeLImage(nom).map(({ ref, nom: n, surface }) => ({ ref, nom: n, surface })) };
  }
  return sortie;
}
