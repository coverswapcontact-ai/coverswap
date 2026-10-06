import type { ImgHTMLAttributes } from "react";
import { MEDIA_TELEPHONE, plafonnerSrcset, type SourcesImage } from "@/lib/sources-image";

/**
 * Une image en `<picture>` (mission 16, partie 3) : AVIF et WebP en `<source>`,
 * le JPEG (ou l'image telle quelle) en `<img>`. UN seul rendu pour `Photo`
 * (images du dépôt préparées par `scripts/preparer-images.mjs`) et
 * `AvantApres` (l'ouverture et les cartes de réalisation : images préparées,
 * ou photos publiées par le CRM en WebP réduit, `?l=`). Une source absente
 * n'est pas écrite ; `width` / `height` seulement s'ils sont connus (sinon le
 * cadre réserve la place par `aspect-ratio`). Sans état : composant serveur ou
 * client.
 *
 * Site 3.0, lot F6 (poids des pages) : une image du dépôt a toujours son AVIF ; on n'écrit plus alors ni son WebP ni
 * sa série JPEG plafonnée du téléphone. Tout navigateur actuel lit l'AVIF ; celui qui ne le lit pas (Safari d'avant
 * iOS 16) prend le JPEG de l'`<img>`. Trois séries au lieu de six par image : /inspirations perd le tiers de son HTML.
 * Une photo du CRM (WebP seulement) garde ses deux sources WebP.
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
  const webp = sources.avif ? undefined : sources.webp;
  const jpgTelephone = sources.avif ? undefined : sources.jpg;
  const telephone = [sources.avif, webp, jpgTelephone].some((s) => !!s && plafond(s) !== s);
  return (
    <picture>
      {telephone && sources.avif ? <source media={MEDIA_TELEPHONE} type="image/avif" srcSet={plafond(sources.avif)} sizes={tailles} /> : null}
      {telephone && webp ? <source media={MEDIA_TELEPHONE} type="image/webp" srcSet={plafond(webp)} sizes={tailles} /> : null}
      {telephone && jpgTelephone ? <source media={MEDIA_TELEPHONE} srcSet={plafond(jpgTelephone)} sizes={tailles} /> : null}
      {sources.avif ? <source type="image/avif" srcSet={sources.avif} sizes={tailles} /> : null}
      {webp ? <source type="image/webp" srcSet={webp} sizes={tailles} /> : null}
      <img src={sources.src} srcSet={sources.jpg} sizes={sources.jpg ? tailles : undefined} width={sources.largeur} height={sources.hauteur} alt={alt} {...props} />
    </picture>
  );
}
