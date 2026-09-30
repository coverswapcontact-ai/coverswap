import type { ImgHTMLAttributes } from "react";
import { MEDIA_TELEPHONE, plafonnerSrcset, type SourcesImage } from "@/lib/images-preparees";

/**
 * Une image en `<picture>` (mission 16, partie 3) : AVIF et WebP en `<source>`,
 * le JPEG (ou l'image telle quelle) en `<img>`. UN seul rendu pour `Photo`
 * (images du dépôt préparées par `scripts/preparer-images.mjs`) et
 * `AvantApres` (l'ouverture et les cartes de réalisation : images préparées,
 * ou photos publiées par le CRM en WebP réduit, `?l=`). Une source absente
 * n'est pas écrite ; `width` / `height` seulement s'ils sont connus (sinon le
 * cadre réserve la place par `aspect-ratio`). Sans état : composant serveur ou
 * client.
 */
export type ProprietesImagePreparee = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "width" | "height" | "alt"> & {
  sources: SourcesImage;
  /** L'attribut `sizes`. */
  tailles?: string;
  alt: string;
};

export function ImagePreparee({ sources, tailles, alt, ...props }: ProprietesImagePreparee) {
  // Téléphone : la même série plafonnée à 960 px (voir `plafonnerSrcset`), écrite seulement si elle diffère. Toutes
  // les sources du téléphone viennent AVANT les autres (la première qui convient l'emporte).
  const plafond = (s?: string) => (s ? plafonnerSrcset(s) : undefined);
  const telephone = [sources.avif, sources.webp, sources.jpg].some((s) => !!s && plafond(s) !== s);
  return (
    <picture>
      {telephone && sources.avif ? <source media={MEDIA_TELEPHONE} type="image/avif" srcSet={plafond(sources.avif)} sizes={tailles} /> : null}
      {telephone && sources.webp ? <source media={MEDIA_TELEPHONE} type="image/webp" srcSet={plafond(sources.webp)} sizes={tailles} /> : null}
      {telephone && sources.jpg ? <source media={MEDIA_TELEPHONE} srcSet={plafond(sources.jpg)} sizes={tailles} /> : null}
      {sources.avif ? <source type="image/avif" srcSet={sources.avif} sizes={tailles} /> : null}
      {sources.webp ? <source type="image/webp" srcSet={sources.webp} sizes={tailles} /> : null}
      <img src={sources.src} srcSet={sources.jpg} sizes={sources.jpg ? tailles : undefined} width={sources.largeur} height={sources.hauteur} alt={alt} {...props} />
    </picture>
  );
}
