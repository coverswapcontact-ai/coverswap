"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRetourNavigateur } from "./Feuille";
import { ZoomImage } from "./ZoomImage";

/**
 * Plein écran d'un rendu (mission 15, partie 4) : l'image sur fond sombre, à
 * pincer pour zoomer ; « Avant / Après » quand la photo d'origine existe ;
 * fermeture par le bouton (44 px), Échap ou le geste retour.
 */
export function PleinEcran(props: { ouvert: boolean; onFermer: () => void; apres: string; avant: string | null; alt: string; actions?: ReactNode }) {
  // Remonté à chaque ouverture : l'état « avant / après » repart à « après » sans setState dans un effet.
  return props.ouvert ? <PleinEcranOuvert key={props.apres} {...props} /> : null;
}

function PleinEcranOuvert({ ouvert, onFermer, apres, avant, alt, actions }: { ouvert: boolean; onFermer: () => void; apres: string; avant: string | null; alt: string; actions?: ReactNode }) {
  useRetourNavigateur(ouvert, onFermer);
  const [montre, setMontre] = useState<"apres" | "avant">("apres");
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert, onFermer]);
  if (!ouvert || typeof document === "undefined") return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Rendu en plein écran" className="fixed inset-0 z-[80] flex flex-col bg-sombre text-blanc">
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2">
        {avant ? (
          <div className="flex rounded-[var(--rayon-sm)] border border-white/25 p-0.5" role="group" aria-label="Avant ou après">
            {(["avant", "apres"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={montre === v} onClick={() => setMontre(v)} className={`min-h-[44px] rounded-[4px] px-4 text-[14px] font-medium transition-colors duration-[var(--duree-courte)] ${montre === v ? "bg-white text-sombre" : "text-blanc/80"}`}>
                {v === "avant" ? "Avant" : "Après"}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {actions}
          <button type="button" onClick={onFermer} aria-label="Fermer le plein écran" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-blanc transition-colors duration-[var(--duree-courte)] active:bg-white/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
        <ZoomImage src={montre === "avant" && avant ? avant : apres} alt={montre === "avant" ? "Votre pièce aujourd'hui" : alt} className="h-full w-full" />
      </div>
    </div>,
    document.body
  );
}
