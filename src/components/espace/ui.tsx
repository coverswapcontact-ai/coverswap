"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { IconeRetour } from "./Illustrations";

/**
 * Briques visuelles de l'espace client. Fond clair, beaucoup d'air, une seule
 * action rouge par écran ; tout se touche au pouce (52 px au moins), tout se
 * lit sans zoom (17 px), contrastes AA.
 */

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]";

export function BoutonPrincipal({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#CC0000] px-5 text-[17px] font-semibold text-white transition-colors active:bg-[#A80000] disabled:bg-[#D9D6D0] disabled:text-[#6B665F]",
        FOCUS,
        className
      )}
    >
      {children}
    </button>
  );
}

export function BoutonSecondaire({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cx("flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#D3CFC8] bg-white px-5 text-[16px] font-medium text-[#1A1A1A] active:bg-[#F2F0EC] disabled:opacity-50", FOCUS, className)}
    >
      {children}
    </button>
  );
}

export function LienPrincipal({ children, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={cx("flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#CC0000] px-5 text-[17px] font-semibold text-white active:bg-[#A80000]", FOCUS, className)}>
      {children}
    </a>
  );
}

export function Carte({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-[22px] border border-[#E6E3DD] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.04)]", className)}>{children}</section>;
}

export function Surtitre({ children, ton = "gris" }: { children: ReactNode; ton?: "gris" | "rouge" | "vert" }) {
  return <p className={cx("text-[13px] font-semibold tracking-[0.08em] uppercase", ton === "rouge" ? "text-[#B00000]" : ton === "vert" ? "text-[#1F6B45]" : "text-[#6B665F]")}>{children}</p>;
}

/** En-tête d'une étape : retour à l'accueil, titre, une phrase. */
export function EnteteEtape({ titre, phrase, onRetour, avant }: { titre: string; phrase?: ReactNode; onRetour: () => void; avant?: ReactNode }) {
  return (
    <div className="pt-1">
      <button type="button" onClick={onRetour} className={cx("-ml-2 flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-[16px] font-medium text-[#1A1A1A] active:bg-[#ECEAE5]", FOCUS)}>
        <IconeRetour /> Mon projet
      </button>
      {avant ? <div className="mt-3">{avant}</div> : null}
      <h1 className="mt-3 font-display text-[29px] leading-[1.12] font-semibold tracking-tight text-balance text-[#1A1A1A]">{titre}</h1>
      {phrase ? <p className="mt-2.5 text-[17px] leading-relaxed text-[#4F4A44]">{phrase}</p> : null}
    </div>
  );
}

/** Case à cocher tactile (grande, lisible), avec un texte d'aide facultatif. */
export function CaseCarte({ coche, onBasculer, titre, aide, illustration, className }: { coche: boolean; onBasculer: () => void; titre: string; aide?: string; illustration?: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={coche}
      aria-label={aide ? `${titre} — ${aide}` : titre}
      onClick={onBasculer}
      className={cx(
        "relative flex w-full flex-col items-start gap-2 rounded-2xl border-2 bg-white p-3 text-left transition-colors",
        coche ? "border-[#1A1A1A] bg-[#FAF9F7]" : "border-[#E2DFD9] active:bg-[#F6F5F2]",
        FOCUS,
        className
      )}
    >
      {illustration}
      <span className="pr-7">
        <span className="block text-[16px] leading-snug font-semibold text-[#1A1A1A]">{titre}</span>
        {aide ? <span className="mt-0.5 block text-[14px] leading-snug text-[#5F5A53]">{aide}</span> : null}
      </span>
      <span
        aria-hidden
        className={cx("absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[13px] font-bold", coche ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#BDB8B0] bg-white")}
      >
        {coche ? "✓" : ""}
      </span>
    </button>
  );
}

/** Message qui s'annonce aux lecteurs d'écran. */
export function Annonce({ children, ton = "info" }: { children: ReactNode; ton?: "info" | "succes" | "erreur" }) {
  return (
    <p
      role={ton === "erreur" ? "alert" : "status"}
      className={cx(
        "rounded-2xl px-4 py-3 text-[15.5px] leading-snug",
        ton === "succes" ? "bg-[#E7F3EC] text-[#17563A]" : ton === "erreur" ? "bg-[#FBE9E7] text-[#8F1D12]" : "bg-[#F1EFEA] text-[#3F3B36]"
      )}
    >
      {children}
    </p>
  );
}

/** Bouton « Copier » : la valeur part dans le presse-papiers, le bouton le dit. */
export function useCopie(): [string | null, (cle: string, valeur: string) => Promise<void>] {
  const [copie, setCopie] = useState<string | null>(null);
  const minuterie = useRef<number | null>(null);
  const copier = useCallback(async (cle: string, valeur: string) => {
    try {
      await navigator.clipboard.writeText(valeur);
    } catch {
      const zone = document.createElement("textarea");
      zone.value = valeur;
      zone.setAttribute("readonly", "");
      zone.style.position = "fixed";
      zone.style.opacity = "0";
      document.body.appendChild(zone);
      zone.select();
      document.execCommand("copy");
      zone.remove();
    }
    setCopie(cle);
    if (minuterie.current) window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => setCopie(null), 2500);
  }, []);
  useEffect(() => () => (minuterie.current ? window.clearTimeout(minuterie.current) : undefined), []);
  return [copie, copier];
}
