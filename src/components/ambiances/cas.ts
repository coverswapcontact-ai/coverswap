import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { ambianceDeLImage, type AmbianceResolue } from "@/lib/ambiances";
import type { MatiereCartel } from "@/lib/cartel";
import { sourcesPhoto, type ManifesteImages, type SourcesPhoto } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { imageObjet, legendeAmbiance } from "@/lib/donnees-images";
import { avecDepuis } from "@/lib/liens-simulateur";
import { matiereCartel } from "@/lib/matieres-vedettes";

/**
 * Le cas d'une ambiance (site 3.0, lots B6 et C1), en données pures : rendu par `CarteAmbiance`.
 *
 * Lot F7 : séparé de `CarteAmbiance.tsx`. Ce module n'importe AUCUN composant : `lib/partage.ts` (lu par
 * `metadonneesPage`, donc par toutes les pages, et par le gabarit) passe par `inspirations/_components/ordre.ts`, qui
 * résout des cas. Tant que `resoudreCas` vivait à côté de la carte, le curseur `AvantApres` (composant client) entrait
 * dans le graphe de chaque page et du gabarit, et son JavaScript (avec le plein écran, le calque des matières et le
 * manifeste des images) partait sur toutes les pages, même sans curseur. perf.test.ts le verrouille.
 */
export type CasAmbiance = {
  /** Le titre de la carte : un nom choisi (accueil), sinon celui de l'ambiance. */
  nom: string;
  ambiance: AmbianceResolue;
  /** Le texte de l'« avant » (paire seulement). */
  altAvant?: string;
  ratio: string;
  preparees: { avant: SourcesPhoto | null; apres: SourcesPhoto };
  /** Les matières posées, une fois chacune, avec les surfaces qui les portent. */
  matieres: { surfaces: string; matiere: MatiereCartel }[];
  lien: string;
};

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Les matières d'une ambiance, une fois chacune : les surfaces d'une même référence réunies (« Meubles bas et meubles hauts »). */
export function regrouperMatieres(surfaces: readonly { surface: string; ref: string; nom: string; famille?: string; hex?: string }[]): { surfaces: string; matiere: MatiereCartel }[] {
  const parRef = new Map<string, { surfaces: string[]; matiere: MatiereCartel }>();
  for (const s of surfaces) {
    const deja = parRef.get(s.ref);
    if (deja) deja.surfaces.push(s.surface);
    else parRef.set(s.ref, { surfaces: [s.surface], matiere: matiereCartel(s.ref) ?? { id: s.ref, nom: s.nom, famille: s.famille ?? "", ...(s.hex ? { hex: s.hex } : {}) } });
  }
  return [...parRef.values()].map((m) => ({ surfaces: majuscule(m.surfaces.join(" et ")), matiere: m.matiere }));
}

/** Le cas d'une image (nom du manifeste, l'« après » d'une paire ou une image seule) ; `null` si elle n'est pas préparée ou n'a pas d'ambiance. */
export function resoudreCas(image: string, { nom, depuis }: { nom?: string; depuis: string }, manifeste: ManifesteImages = MANIFESTE_IMAGES): CasAmbiance | null {
  const ambiance = ambianceDeLImage(image);
  const sApres = sourcesPhoto(image, manifeste);
  if (!ambiance || !sApres) return null;
  const sAvant = ambiance.avant ? sourcesPhoto(ambiance.avant, manifeste) : null;
  if (ambiance.avant && !sAvant) return null;
  const paire = ambiance.avant ? PAIRES_SERIE_2.find((p) => p.avant === ambiance.avant) : undefined;
  return {
    nom: nom ?? ambiance.titre,
    ambiance,
    ...(sAvant ? { altAvant: paire ? `${paire.scene}. Image d'ambiance.` : "La même pièce avant la pose, avec ses matières d'origine. Image d'ambiance." } : {}),
    ratio: paire?.ratio ?? `${sApres.largeur} / ${sApres.hauteur}`,
    preparees: { avant: sAvant, apres: sApres },
    matieres: regrouperMatieres(ambiance.surfaces),
    lien: avecDepuis(ambiance.lienComposition, depuis),
  };
}

/**
 * L'`ImageObject` d'un cas qui est un avant / après (site 3.0, lot F4) : l'« après », légendé par le titre de la carte et
 * ses matières, décrit par son texte alternatif, `creditText` d'ambiance ; `null` pour une photo seule.
 */
export function imageObjetCas(cas: CasAmbiance): Record<string, unknown> | null {
  if (!cas.preparees.avant) return null;
  return imageObjet({ src: cas.preparees.apres.src, sources: cas.preparees.apres, legende: legendeAmbiance(cas.nom, cas.ambiance.surfaces), description: `Ambiance · avant / après. ${cas.ambiance.alt}`, ambiance: true });
}
