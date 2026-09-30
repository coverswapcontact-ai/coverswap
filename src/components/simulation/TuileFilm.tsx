"use client";

import { useState } from "react";

/**
 * Une tuile de film Cover Styl' (mission 15, partie 4) : la vignette carrée
 * servie par le CRM, le nom, la référence. Hauteur fixe (rien ne saute) ; si
 * la vignette ne répond pas, un carré uni avec la référence.
 *
 * Mission 16 (partie 3) :
 *  - `taille="grand"` : la vignette en grand carré (320 px servis, `1 / 1`
 *    réservé) au-dessus du libellé, du nom et de la référence — les huit
 *    matières de l'accueil ;
 *  - `reference` : la même chose que `ref`, pour un composant SERVEUR — React
 *    refuse de passer une prop nommée `ref` d'un composant serveur à un
 *    composant client (« Refs cannot be used in Server Components, nor passed
 *    to Client Components ») ; le simulateur et l'espace gardent `ref`.
 */
type ProprietesTuile = { nom: string; libelle?: string; vignette: string; taille?: "sm" | "md" | "grand" } & ({ ref: string; reference?: never } | { reference: string; ref?: never });

export function TuileFilm({ ref: refClient, reference: refServeur, nom, libelle, vignette, taille = "sm" }: ProprietesTuile) {
  const [echec, setEchec] = useState(false);
  const reference = refServeur ?? refClient ?? "";

  if (taille === "grand") {
    return (
      <span className="block">
        <span className="relative block aspect-square overflow-hidden rounded-[var(--rayon-md)] bg-fond-2 ring-1 ring-black/10">
          {echec ? (
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-encre-2">{reference}</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- vignette servie par le CRM
            <img src={vignette} alt="" width={320} height={320} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" onError={() => setEchec(true)} />
          )}
        </span>
        {libelle ? <span className="mt-2.5 block text-[13px] text-encre-2">{libelle}</span> : null}
        <span className={`${libelle ? "" : "mt-2.5 "}block truncate text-[15px] font-medium text-encre`}>
          {nom} <span className="text-encre-2">· {reference}</span>
        </span>
      </span>
    );
  }

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
