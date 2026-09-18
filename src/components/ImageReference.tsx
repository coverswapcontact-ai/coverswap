"use client";

import Image from "next/image";
import { useState } from "react";

/** Teinte de la tuile de remplacement, par famille : sobre, dans les gris du site. */
const FONDS: Record<string, string> = {
  bois: "linear-gradient(135deg, #3b2a1c 0%, #5a4029 100%)",
  pierre: "linear-gradient(135deg, #3a3a3c 0%, #57575a 100%)",
  beton: "linear-gradient(135deg, #2f3133 0%, #4a4d50 100%)",
  couleur: "linear-gradient(135deg, #3a2226 0%, #5a3037 100%)",
  metal: "linear-gradient(135deg, #2b3138 0%, #4a545f 100%)",
  textile: "linear-gradient(135deg, #2f2838 0%, #4a3f59 100%)",
  paillettes: "linear-gradient(135deg, #38321d 0%, #5a5030 100%)",
};

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
 */
export default function ImageReference({ src, alt, reference, nom, famille, sizes, className = "", prioritaire, compact, onCharge, onEchec }: Props) {
  const [echec, setEchec] = useState(false);

  if (echec || !src) {
    return (
      <div role="img" aria-label={`${nom} (${reference}) — visuel indisponible`} className="absolute inset-0 flex flex-col items-center justify-center text-center p-2" style={{ background: FONDS[famille] ?? FONDS.pierre }}>
        <span className={`font-display font-bold text-white/90 ${compact ? "text-sm" : "text-xl sm:text-2xl"}`}>{reference}</span>
        {compact ? null : <span className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">{nom}</span>}
        <span className={`text-white/60 mt-1 ${compact ? "text-[9px] leading-tight" : "text-[11px]"}`}>{compact ? "Visuel indisponible" : "Visuel indisponible — échantillon sur demande"}</span>
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
