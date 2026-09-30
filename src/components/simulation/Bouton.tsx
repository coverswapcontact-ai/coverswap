"use client";

import { useId, type ReactNode } from "react";

/**
 * Le bouton du simulateur (mission 15, partie 4) : principal (encre) ou
 * secondaire (contour), trois états — actif, occupé (le libellé le dit, rien
 * ne tourne), désactivé AVEC la raison lisible juste dessous (jamais un bouton
 * gris muet). 48 px de haut, coins peu arrondis, transition courte.
 */
export type ProprietesBouton = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> & {
  variante?: "principal" | "secondaire" | "discret";
  occupe?: boolean;
  /** Libellé pendant l'occupation (« Lancement… »). */
  libelleOccupe?: string;
  /** Une raison : le bouton est désactivé et la raison s'affiche dessous. */
  raisonDesactive?: string | null;
  children: ReactNode;
  /** Largeur pleine (mobile d'abord). */
  plein?: boolean;
};

/** Un champ de fichier invisible (`sr-only`) dans un libellé-bouton : c'est le libellé qui montre le focus clavier (`:has(:focus-visible)`). */
export const FOCUS_FICHIER = "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-encre";

const BASE = "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--rayon-sm)] px-5 text-[16px] font-medium transition-colors duration-[var(--duree-courte)] ease-[var(--ease)] disabled:cursor-not-allowed";
const VARIANTES = {
  principal: "bg-encre text-white hover:bg-encre-survol active:bg-encre-survol disabled:bg-trait disabled:text-encre-2",
  secondaire: "border border-encre bg-transparent text-encre hover:bg-encre hover:text-white active:bg-encre active:text-white disabled:border-trait disabled:text-encre-2 disabled:hover:bg-transparent",
  discret: "text-encre-2 underline underline-offset-4 hover:text-encre disabled:text-trait",
};

export function Bouton({ variante = "principal", occupe = false, libelleOccupe, raisonDesactive, children, plein = false, className, type = "button", ...props }: ProprietesBouton) {
  const idRaison = useId();
  const desactive = occupe || !!raisonDesactive;
  return (
    <div className={plein ? "w-full" : "inline-flex flex-col"}>
      <button type={type} {...props} disabled={desactive} aria-busy={occupe || undefined} aria-describedby={raisonDesactive ? idRaison : props["aria-describedby"]} className={`${BASE} ${VARIANTES[variante]} ${plein ? "w-full" : ""} ${className ?? ""}`}>
        {occupe ? (libelleOccupe ?? "Un instant…") : children}
      </button>
      {raisonDesactive ? (
        <p id={idRaison} role="status" className="mt-1.5 min-h-[20px] text-[13.5px] leading-snug text-encre-2">
          {raisonDesactive}
        </p>
      ) : null}
    </div>
  );
}
