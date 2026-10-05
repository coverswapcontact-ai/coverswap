import { useId, type ReactNode } from "react";

/**
 * Mission 16 : sans « use client » — un composant partagé (useId marche des
 * deux côtés) dont `classesBouton` doit rester appelable par les composants
 * serveur (`Lien`, en-tête, pied de page).
 *
 * Le bouton du simulateur (mission 15, partie 4) : principal, secondaire
 * (contour), trois états — actif, occupé (le libellé le dit, rien ne tourne),
 * désactivé AVEC la raison lisible juste dessous (jamais un bouton gris
 * muet). 48 px de haut, coins peu arrondis, transition courte.
 *
 * Site 3.0, lot B2 — le rouge est réservé aux actions (docs/DESIGN.md) :
 *  - `principal` : le rouge CoverSwap (`bg-accent`, blanc dessus, 6,54:1 ;
 *    `accent-survol` au survol et à l'appui), UN par écran ;
 *  - `secondaire` : le contour à l'encre, sur le papier ;
 *  - `sur-encre` : le contour au papier, pour un bloc encre (dernier appel,
 *    pied de page, WhatsApp posé sur l'encre) ;
 *  - `discret` : le lien souligné.
 * Ce fichier est, avec l'en-tête (lien « Simuler »), la pastille « 497
 * matières » et le logo, le seul endroit où le rouge s'écrit (theme.test.ts).
 */
export type ProprietesBouton = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> & {
  variante?: VarianteBouton;
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
/** Les teintes du bouton principal, sans la forme : pour un libellé-bouton de fichier (`EcranPhoto`) qui a sa propre forme. */
export const TEINTE_PRINCIPALE = "bg-accent text-blanc hover:bg-accent-survol active:bg-accent-survol";
const VARIANTES = {
  principal: `${TEINTE_PRINCIPALE} disabled:bg-trait disabled:text-encre-2`,
  secondaire: "border border-encre bg-transparent text-encre hover:bg-encre hover:text-blanc active:bg-encre active:text-blanc disabled:border-trait disabled:text-encre-2 disabled:hover:bg-transparent",
  "sur-encre": "border border-fond bg-transparent text-fond hover:bg-fond/10 active:bg-fond/10 focus-visible:outline-fond disabled:border-sur-encre-2 disabled:text-sur-encre-2 disabled:hover:bg-transparent",
  discret: "text-encre-2 underline underline-offset-4 hover:text-encre disabled:text-trait",
};

export type VarianteBouton = keyof typeof VARIANTES;

/**
 * Les classes du bouton (mission 16) : partagées par `Bouton` (un `<button>`)
 * et `Lien` (un `<a>`), pour que le site, le simulateur et l'espace aient un
 * seul bouton. 48 px de haut (cible ≥ 44 px), coins peu arrondis.
 */
export function classesBouton(variante: VarianteBouton = "principal", plein = false): string {
  return `${BASE} ${VARIANTES[variante]}${plein ? " w-full" : ""}`;
}

export function Bouton({ variante = "principal", occupe = false, libelleOccupe, raisonDesactive, children, plein = false, className, type = "button", ...props }: ProprietesBouton) {
  const idRaison = useId();
  const desactive = occupe || !!raisonDesactive;
  return (
    <div className={plein ? "w-full" : "inline-flex flex-col"}>
      <button type={type} {...props} disabled={desactive} aria-busy={occupe || undefined} aria-describedby={raisonDesactive ? idRaison : props["aria-describedby"]} className={`${classesBouton(variante, plein)} ${className ?? ""}`}>
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
