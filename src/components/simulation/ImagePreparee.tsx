import type { ImgHTMLAttributes } from "react";
import type { SourcesImage } from "@/lib/images-preparees";

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
  return (
    <picture>
      {sources.avif ? <source type="image/avif" srcSet={sources.avif} sizes={tailles} /> : null}
      {sources.webp ? <source type="image/webp" srcSet={sources.webp} sizes={tailles} /> : null}
      <img src={sources.src} srcSet={sources.jpg} sizes={sources.jpg ? tailles : undefined} width={sources.largeur} height={sources.hauteur} alt={alt} {...props} />
    </picture>
  );
}
