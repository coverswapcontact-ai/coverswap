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

/**
 * Site 3.0, lot F6 : le WebP préparé reste produit sur le disque, mais n'est plus annoncé — l'AVIF (lu par tout
 * navigateur actuel) et le JPEG de repli suffisent ; chaque série en moins allège le HTML et la charge RSC des pages à
 * nombreuses images (/inspirations : ~100 images). `ImagePreparee` n'écrit pas non plus de WebP à côté d'un AVIF.
 */
export type SourcesPhoto = {
  avif: string;
  /** `srcset` des JPEG (repli universel). */
  jpg: string;
  /** Le JPEG du `src` : la plus grande largeur ≤ 960 (ou la plus petite). */
  src: string;
  largeur: number;
  hauteur: number;
};

export type { SourcesImage } from "./sources-image";
export { LARGEUR_MAX_TELEPHONE, MEDIA_ECRAN_LARGE, MEDIA_TELEPHONE, plafonnerSrcset } from "./sources-image";

/**
 * Les `srcset` AVIF / JPEG et les dimensions d'une image du manifeste ; `null` si le nom est inconnu.
 *
 * Mission 16 (partie 6) : `/images/prep/*` est servi en cache immuable d'un an (`next.config.ts › headers`), et un
 * original remplacé garde son nom de fichier : chaque adresse porte donc l'empreinte de son original (`?v=<empreinte>`,
 * celle du manifeste). Une image refaite change d'adresse, le navigateur la recharge ; sinon, elle ne se redemande
 * jamais.
 */
export function sourcesPhoto(nom: string, manifeste: ManifesteImages = MANIFESTE_IMAGES): SourcesPhoto | null {
  const entree = Object.prototype.hasOwnProperty.call(manifeste, nom) ? manifeste[nom] : undefined;
  if (!entree || entree.largeurs.length === 0) return null;
  const largeurs = [...entree.largeurs].sort((a, b) => a - b);
  const version = entree.empreinte && /^[0-9a-f]{6,40}$/.test(entree.empreinte) ? `?v=${entree.empreinte}` : "";
  const fichier = (l: number, ext: string) => `${DOSSIER_IMAGES}/${nom}-${l}.${ext}${version}`;
  const srcset = (ext: string) => largeurs.map((l) => `${fichier(l, ext)} ${l}w`).join(", ");
  const moyennes = largeurs.filter((l) => l <= 960);
  const largeurSrc = moyennes.length > 0 ? moyennes[moyennes.length - 1] : largeurs[0];
  return { avif: srcset("avif"), jpg: srcset("jpg"), src: fichier(largeurSrc, "jpg"), largeur: entree.largeur, hauteur: entree.hauteur };
}

/** Vrai si l'image est préparée (présente au manifeste avec au moins une largeur). */
export function imagePreparee(nom: string, manifeste: ManifesteImages = MANIFESTE_IMAGES): boolean {
  return sourcesPhoto(nom, manifeste) !== null;
}
