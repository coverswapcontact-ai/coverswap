import { MANIFESTE_IMAGES } from "./images-manifeste";

/**
 * Les images préparées du site (mission 16). Le site n'utilise pas
 * l'optimiseur de Vercel (`images.unoptimized`, quota épuisé → 402) : chaque
 * image du dépôt est produite en local, une fois, par
 * `scripts/preparer-images.mjs` (`npm run images`), en AVIF + WebP + JPEG aux
 * largeurs 480 / 960 / 1600 plafonnées à l'origine (jamais agrandie), dans
 * `public/images/prep/<nom>-<largeur>.<avif|webp|jpg>`, et décrite par le
 * manifeste généré `src/lib/images-manifeste.ts` (à ne pas éditer à la main).
 * Ce module-ci, écrit à la main, en lit les entrées pour `Photo`.
 */
export type EntreeImage = {
  /** Dimensions de l'image d'origine : `width` / `height` réservés (CLS 0). */
  largeur: number;
  hauteur: number;
  /** Largeurs produites, croissantes (480, 960, 1600 plafonnées à l'origine). */
  largeurs: number[];
  /**
   * Empreinte de l'original (sha1 de ses octets, 12 caractères), écrite par le script : un original remplacé sous le
   * même nom ne la retrouve plus, et ses sorties sont refaites. Toujours présente dans le manifeste généré.
   */
  empreinte?: string;
};

export type ManifesteImages = Record<string, EntreeImage>;

/** Dossier public des images préparées. */
export const DOSSIER_IMAGES = "/images/prep";

export type SourcesPhoto = {
  avif: string;
  webp: string;
  /** `srcset` des JPEG (repli universel). */
  jpg: string;
  /** Le JPEG du `src` : la plus grande largeur ≤ 960 (ou la plus petite). */
  src: string;
  largeur: number;
  hauteur: number;
};

/**
 * Ce que `ImagePreparee` (`components/simulation`) sait rendre : une image du dépôt (`SourcesPhoto`, tout est connu) ou
 * une photo publiée par le CRM (`sourcesPhotoCrm` de `lib/publications` : WebP réduits en `srcset`, la photo telle
 * quelle en `src`, dimensions inconnues). Une source absente n'est pas écrite.
 */
export type SourcesImage = {
  avif?: string;
  webp?: string;
  /** `srcset` des JPEG. */
  jpg?: string;
  /** L'image du `src` (le repli). */
  src: string;
  largeur?: number;
  hauteur?: number;
};

/** Les `srcset` AVIF / WebP / JPEG et les dimensions d'une image du manifeste ; `null` si le nom est inconnu. */
export function sourcesPhoto(nom: string, manifeste: ManifesteImages = MANIFESTE_IMAGES): SourcesPhoto | null {
  const entree = Object.prototype.hasOwnProperty.call(manifeste, nom) ? manifeste[nom] : undefined;
  if (!entree || entree.largeurs.length === 0) return null;
  const largeurs = [...entree.largeurs].sort((a, b) => a - b);
  const fichier = (l: number, ext: string) => `${DOSSIER_IMAGES}/${nom}-${l}.${ext}`;
  const srcset = (ext: string) => largeurs.map((l) => `${fichier(l, ext)} ${l}w`).join(", ");
  const moyennes = largeurs.filter((l) => l <= 960);
  const largeurSrc = moyennes.length > 0 ? moyennes[moyennes.length - 1] : largeurs[0];
  return { avif: srcset("avif"), webp: srcset("webp"), jpg: srcset("jpg"), src: fichier(largeurSrc, "jpg"), largeur: entree.largeur, hauteur: entree.hauteur };
}

/** Vrai si l'image est préparée (présente au manifeste avec au moins une largeur). */
export function imagePreparee(nom: string, manifeste: ManifesteImages = MANIFESTE_IMAGES): boolean {
  return sourcesPhoto(nom, manifeste) !== null;
}
