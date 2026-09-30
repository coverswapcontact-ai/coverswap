"use client";

import { useState } from "react";

/**
 * Une tuile de film Cover Styl' (mission 15, partie 4) : la vignette carrée
 * servie par le CRM, le nom, la référence. Hauteur fixe (rien ne saute) ; si
 * la vignette ne répond pas, un carré uni avec la référence.
 */
export function TuileFilm({ ref: reference, nom, libelle, vignette, taille = "sm" }: { ref: string; nom: string; libelle?: string; vignette: string; taille?: "sm" | "md" }) {
  const [echec, setEchec] = useState(false);
  const cote = taille === "md" ? "h-14 w-14" : "h-10 w-10";
  return (
    <span className="flex items-center gap-2.5">
      <span className={`${cote} shrink-0 overflow-hidden rounded-[var(--rayon-sm)] bg-fond-2 ring-1 ring-black/10`}>
        {echec ? (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-encre-2">{reference}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM
          <img src={vignette} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setEchec(true)} />
        )}
      </span>
      <span className="min-w-0">
        {libelle ? <span className="block truncate text-[13px] text-encre-2">{libelle}</span> : null}
        <span className="block truncate text-[15px] font-medium text-encre">
          {nom} <span className="text-encre-2">· {reference}</span>
        </span>
      </span>
    </span>
  );
}
