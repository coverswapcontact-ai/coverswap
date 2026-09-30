"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { apresHistorique, entrerFeuille } from "./historique-feuilles";

/**
 * Feuille plein écran pour le pouce (mission 15, partie 4 : extraite de
 * `espace/ui.tsx`, partagée par le simulateur du site et l'espace client).
 *  - le corps de la page est VERROUILLÉ par `position: fixed` avec `top:
 *    -scrollY`, restauré à la fermeture (aucun saut de page, ni sur iOS où
 *    `overflow: hidden` ne suffit pas) ; la barre de défilement d'ordinateur
 *    est compensée (rien ne se décale) ; une seule feuille verrouille, la
 *    dernière fermée libère ;
 *  - z-index au-dessus de tout ce que le site pose (en-tête 50, cookies 50) ;
 *  - Échap ferme la feuille du dessus, glisser vers le bas depuis le haut du
 *    contenu aussi, et le geste retour du téléphone (historique).
 */

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

/* ── Historique du navigateur (logique pure : `historique-feuilles.ts`) ── */

/** Lie une feuille (ou tout panneau) au geste retour : ouverte = une entrée d'historique ; retour = fermée. */
export function useRetourNavigateur(ouverte: boolean, fermer: () => void) {
  const rappel = useRef(fermer);
  useEffect(() => {
    rappel.current = fermer;
  });
  useEffect(() => {
    if (!ouverte) return;
    return entrerFeuille(() => rappel.current());
  }, [ouverte]);
}

/**
 * Les liens posés dans une feuille (mission 16 : le menu du téléphone, la
 * fiche d'une matière). Au clic, la feuille se ferme D'ABORD (elle rend son
 * entrée d'historique et la page retrouve sa position), puis Next navigue,
 * une fois ce retour fait : partie pendant, la navigation serait abandonnée.
 * Nouvel onglet, clic du milieu, touche de modification : le navigateur fait
 * comme d'habitude. Usage : `const aller = useLiensDeFeuille(ouverte, fermer)`
 * puis `<Link href={h} onClick={aller(h)}>`.
 */
export function useLiensDeFeuille(ouverte: boolean, fermer: () => void) {
  const router = useRouter();
  const cible = useRef<string | null>(null);
  useEffect(() => {
    if (ouverte || cible.current === null) return;
    const href = cible.current;
    cible.current = null;
    apresHistorique(() => router.push(href));
  }, [ouverte, router]);
  return (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    cible.current = href;
    fermer();
  };
}

/* ── Verrouillage du corps de la page ─────────────────────────────── */

let verrous = 0;
let restaurer: (() => void) | null = null;

function verrouillerLaPage() {
  verrous++;
  if (verrous > 1) return;
  const html = document.documentElement;
  const body = document.body;
  const scrollY = window.scrollY;
  const barre = window.innerWidth - html.clientWidth;
  const avant = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow, paddingRight: body.style.paddingRight, behavior: html.style.scrollBehavior };
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  if (barre > 0) body.style.paddingRight = `${barre}px`;
  restaurer = () => {
    body.style.position = avant.position;
    body.style.top = avant.top;
    body.style.left = avant.left;
    body.style.right = avant.right;
    body.style.width = avant.width;
    body.style.overflow = avant.overflow;
    body.style.paddingRight = avant.paddingRight;
    // Retour exact à la position d'avant, sans lissage.
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, scrollY);
    html.style.scrollBehavior = avant.behavior;
  };
}

function liberer() {
  verrous = Math.max(0, verrous - 1);
  if (verrous === 0 && restaurer) {
    restaurer();
    restaurer = null;
  }
}

/* ── La feuille ───────────────────────────────────────────────────── */

export type ProprietesFeuille = {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  sousTitre?: ReactNode;
  children: ReactNode;
  pied?: ReactNode;
  libelleFermer?: string;
  sombre?: boolean;
  /** Un en-tête collant sous le titre (recherche, onglets). */
  entete?: ReactNode;
};

export function Feuille({ ouverte, onFermer, titre, sousTitre, children, pied, libelleFermer = "Fermer", sombre = false, entete }: ProprietesFeuille) {
  useRetourNavigateur(ouverte, onFermer);
  const defilement = useRef<HTMLDivElement>(null);
  const boite = useRef<HTMLDivElement>(null);
  const depart = useRef<{ x: number; y: number; actif: boolean } | null>(null);
  const [decalage, setDecalage] = useState(0);
  const fermeture = useRef(onFermer);
  useEffect(() => {
    fermeture.current = onFermer;
  });

  useEffect(() => {
    if (!ouverte) return;
    verrouillerLaPage();
    // Échap ferme la feuille du dessus, pas celle qu'elle recouvre.
    const surTouche = (e: KeyboardEvent) => {
      const feuilles = document.querySelectorAll("[data-feuille]");
      if (e.key === "Escape" && feuilles[feuilles.length - 1] === boite.current) fermeture.current();
    };
    window.addEventListener("keydown", surTouche);
    boite.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", surTouche);
      liberer();
    };
  }, [ouverte]);

  if (!ouverte || typeof document === "undefined") return null;

  const fond = sombre ? "bg-sombre text-blanc" : "bg-fond text-encre";
  return createPortal(
    <div
      ref={boite}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      data-feuille=""
      data-theme="simulation"
      tabIndex={-1}
      className={cx("fixed inset-0 z-[70] flex flex-col overscroll-contain outline-none", fond)}
      style={{ transform: decalage ? `translateY(${decalage}px)` : undefined, transition: decalage ? "none" : `transform var(--duree-moyenne) var(--ease)` }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        depart.current = { x: t.clientX, y: t.clientY, actif: (defilement.current?.scrollTop ?? 0) <= 0 };
      }}
      onTouchMove={(e) => {
        const d = depart.current;
        if (!d?.actif) return;
        const t = e.touches[0];
        const dy = t.clientY - d.y;
        if (dy > 8 && dy > Math.abs(t.clientX - d.x) * 1.2) setDecalage(dy);
        else if (dy < 0) {
          d.actif = false;
          setDecalage(0);
        }
      }}
      onTouchEnd={() => {
        if (decalage > 110) onFermer();
        setDecalage(0);
        depart.current = null;
      }}
    >
      <div className="shrink-0 pt-[env(safe-area-inset-top)]" />
      <div className="mx-auto w-full max-w-xl shrink-0 px-4 pt-2 pb-2">
        <span aria-hidden className={cx("mx-auto mb-2 block h-1 w-10 rounded-full", sombre ? "bg-white/25" : "bg-trait")} />
        <h2 className="font-display text-[22px] leading-tight font-semibold tracking-tight text-balance">{titre}</h2>
        {sousTitre ? <div className={cx("mt-1 text-[15px] leading-snug", sombre ? "text-blanc/70" : "text-encre-2")}>{sousTitre}</div> : null}
      </div>
      {entete ? <div className={cx("shrink-0 border-b", sombre ? "border-white/10" : "border-trait")}>{entete}</div> : null}
      <div ref={defilement} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-xl px-4 pb-4">{children}</div>
      </div>
      <div className={cx("shrink-0 border-t", sombre ? "border-white/10 bg-sombre" : "border-trait bg-white")}>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {pied}
          <button
            type="button"
            onClick={onFermer}
            className={cx("flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--rayon-md)] text-[16.5px] font-semibold transition-colors duration-[var(--duree-courte)]", sombre ? "bg-white/12 text-blanc active:bg-white/20" : "border border-trait bg-white text-encre active:bg-fond-2")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
            {libelleFermer}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
