/**
 * Manifeste des images préparées du site (mission 16). Le site n'utilise pas
 * l'optimiseur de Vercel (`images.unoptimized`, quota épuisé → 402) : chaque
 * image du dépôt est produite en local, une fois, en AVIF + WebP + JPEG aux
 * largeurs 480 / 960 / 1600 (jamais agrandie), dans
 * `public/images/prep/<nom>-<largeur>.<avif|webp|jpg>`, et décrite ici.
 *
 * La partie 2 de la mission 16 regénère l'objet `MANIFESTE_IMAGES` par
 * `scripts/preparer-images.mjs` ; en partie 1, il est vide et `Photo` accepte
 * aussi une `src` directe (images pas encore préparées).
 */
export type EntreeImage = {
  /** Dimensions de l'image d'origine : `width` / `height` réservés (CLS 0). */
  largeur: number;
  hauteur: number;
  /** Largeurs produites, croissantes (celles ≤ l'origine parmi 480, 960, 1600). */
  largeurs: number[];
};

export type ManifesteImages = Record<string, EntreeImage>;

export const MANIFESTE_IMAGES: ManifesteImages = {};

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
