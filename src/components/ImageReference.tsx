"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  reference: string;
  nom: string;
  famille: string;
  sizes: string;
  className?: string;
  prioritaire?: boolean;
  compact?: boolean;
  onCharge?: () => void;
  onEchec?: () => void;
}

/**
 * L'échantillon d'une référence Cover Styl'. Les fichiers vivent chez le
 * fabricant, qui les renomme parfois : si l'image ne répond plus, la carte
 * montre une tuile propre (référence, nom, mention) au lieu d'un carré vide.
 * scripts/verifier-catalogue.mjs retrouve ensuite la nouvelle adresse.
 * Mission 16 : la tuile de repli est unie (`fond-2`), sans dégradé ; `famille`
 * reste dans les propriétés (appelants inchangés) sans effet sur la tuile.
 */
export default function ImageReference({ src, alt, reference, nom, sizes, className = "", prioritaire, compact, onCharge, onEchec }: Props) {
  const [echec, setEchec] = useState(false);

  if (echec || !src) {
    return (
      <div role="img" aria-label={`${nom} (${reference}) — visuel indisponible`} className="absolute inset-0 flex flex-col items-center justify-center bg-fond-2 p-2 text-center">
        <span className={`font-display font-semibold text-encre ${compact ? "text-sm" : "text-xl sm:text-2xl"}`}>{reference}</span>
        {compact ? null : <span className="mt-1 line-clamp-2 text-xs text-encre-2 sm:text-sm">{nom}</span>}
        <span className={`mt-1 text-encre-2 ${compact ? "text-[9px] leading-tight" : "text-[11px]"}`}>{compact ? "Visuel indisponible" : "Visuel indisponible — échantillon sur demande"}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={prioritaire ? "eager" : "lazy"}
      className={className}
      onLoad={onCharge}
      onError={() => {
        setEchec(true);
        onCharge?.();
        onEchec?.();
      }}
    />
  );
}
