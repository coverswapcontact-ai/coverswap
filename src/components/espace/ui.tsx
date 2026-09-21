"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconeCadenas } from "./Illustrations";

/**
 * Briques visuelles de l'espace client. Fond clair, beaucoup d'air, une seule
 * action rouge par écran ; tout se touche au pouce (52 px au moins), tout se
 * lit sans zoom (17 px), contrastes AA.
 */

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

export const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]";

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

/**
 * En-tête d'un onglet : titre, une phrase. Pas de bouton « retour » : la barre
 * d'onglets, toujours là, est la seule navigation.
 */
export function EnteteEtape({ titre, phrase, avant, apres }: { titre: string; phrase?: ReactNode; avant?: ReactNode; apres?: ReactNode }) {
  return (
    <div className="pt-2">
      {avant ? <div className="mb-3">{avant}</div> : null}
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-[29px] leading-[1.12] font-semibold tracking-tight text-balance text-[#1A1A1A]">{titre}</h1>
        {apres}
      </div>
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

/** Où en est l'enregistrement automatique : discret quand tout va bien, clair quand ça coince. */
export type EtatEnregistrement = { etat: "" | "en-cours" | "ok" | "attente" | "erreur" | "apercu"; message?: string };

export function Enregistrement({ etat, className }: { etat: EtatEnregistrement; className?: string }) {
  const texte =
    etat.etat === "en-cours"
      ? "Enregistrement…"
      : etat.etat === "ok"
        ? "Enregistré"
        : etat.etat === "attente"
          ? "Pas de réseau\u00a0: gardé dans votre téléphone, envoyé dès son retour."
          : etat.etat === "erreur" || etat.etat === "apercu"
            ? (etat.message ?? "Non enregistré\u00a0: réessayez.")
            : "";
  return (
    <p className={cx("min-h-[22px] text-[14px] leading-snug", className)} aria-live="polite" role={etat.etat === "erreur" ? "alert" : undefined}>
      {texte ? (
        <span
          className={cx(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
            etat.etat === "ok" ? "bg-[#E7F3EC] text-[#17563A]" : etat.etat === "erreur" ? "bg-[#FBE9E7] text-[#8F1D12]" : etat.etat === "attente" || etat.etat === "apercu" ? "bg-[#FFF1C7] text-[#5C4200]" : "bg-[#F1EFEA] text-[#5F5A53]"
          )}
        >
          {etat.etat === "ok" ? <span aria-hidden>✓</span> : null}
          {texte}
        </span>
      ) : null}
    </p>
  );
}

/** Un onglet pas encore ouvert : pourquoi, et ce qui l'ouvre. */
export function Verrou({ titre, raison, action }: { titre: string; raison: string; action?: { libelle: string; onClick: () => void } | null }) {
  return (
    <div className="space-y-5">
      <EnteteEtape titre={titre} />
      <Carte className="flex flex-col items-center gap-4 px-6 py-9 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1EFEA] text-[#1A1A1A]" aria-hidden>
          <IconeCadenas taille={28} />
        </span>
        <p className="max-w-[20rem] text-[18.5px] leading-snug font-semibold text-balance text-[#1A1A1A]">{raison}</p>
        {action ? <BoutonPrincipal onClick={action.onClick}>{action.libelle}</BoutonPrincipal> : null}
      </Carte>
    </div>
  );
}

/**
 * Bouton « Copier » : la valeur part dans le presse-papiers, le bouton le dit.
 * Si le téléphone refuse (ancien navigateur, page en arrière-plan), il le dit
 * aussi : jamais un « Copié » qui ment.
 */
export function useCopie(): [string | null, (cle: string, valeur: string) => Promise<void>, string | null] {
  const [copie, setCopie] = useState<string | null>(null);
  const [echec, setEchec] = useState<string | null>(null);
  const minuterie = useRef<number | null>(null);
  const copier = useCallback(async (cle: string, valeur: string) => {
    let reussi = false;
    try {
      await navigator.clipboard.writeText(valeur);
      reussi = true;
    } catch {
      const zone = document.createElement("textarea");
      zone.value = valeur;
      zone.setAttribute("readonly", "");
      zone.style.position = "fixed";
      zone.style.opacity = "0";
      document.body.appendChild(zone);
      zone.select();
      try {
        reussi = document.execCommand("copy");
      } catch {
        reussi = false;
      }
      zone.remove();
    }
    setCopie(reussi ? cle : null);
    setEchec(reussi ? null : cle);
    if (minuterie.current) window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => {
      setCopie(null);
      setEchec(null);
    }, reussi ? 2500 : 6000);
  }, []);
  useEffect(() => () => (minuterie.current ? window.clearTimeout(minuterie.current) : undefined), []);
  return [copie, copier, echec];
}

/* ── Feuilles plein écran (téléphone) ────────────────────────────────── */

/**
 * Pile des feuilles ouvertes, liée à l'historique du navigateur : chaque
 * feuille ajoute une entrée ; le geste « retour » (bord gauche sur iPhone,
 * bouton retour sur Android) ferme la feuille du dessus, et seulement elle.
 * Fermée par un bouton, une feuille retire son entrée ; plusieurs feuilles
 * fermées d'un coup (choisir une teinte ferme la vue agrandie ET le
 * catalogue) retirent leurs entrées en une fois.
 */
const pileFeuilles: { id: number; fermer: () => void }[] = [];
/** Identifiants des feuilles dont l'entrée est encore dans l'historique, dans l'ordre. */
const dansHistorique: number[] = [];
let compteurFeuilles = 0;
let ecouteRetour = false;
let synchronisationPrevue = false;

function surRetourNavigateur(evenement: PopStateEvent) {
  const niveau = Number((evenement.state as { feuille?: number } | null)?.feuille) || 0;
  while (dansHistorique.length > 0 && dansHistorique[dansHistorique.length - 1] > niveau) dansHistorique.pop();
  while (pileFeuilles.length > 0 && pileFeuilles[pileFeuilles.length - 1].id > niveau) pileFeuilles.pop()!.fermer();
}

function synchroniserHistorique() {
  synchronisationPrevue = false;
  const haut = pileFeuilles.length > 0 ? pileFeuilles[pileFeuilles.length - 1].id : 0;
  // Un bouton de la feuille a changé d'onglet (« Voir mon devis ») : on ne le défait pas.
  const surNosEntrees = dansHistorique.length > 0 && Number((window.history.state as { feuille?: number } | null)?.feuille) === dansHistorique[dansHistorique.length - 1];
  let entrees = 0;
  while (dansHistorique.length > 0 && dansHistorique[dansHistorique.length - 1] > haut) {
    dansHistorique.pop();
    entrees++;
  }
  if (entrees > 0 && surNosEntrees) window.history.go(-entrees);
}

export function useRetourNavigateur(ouverte: boolean, fermer: () => void) {
  const rappel = useRef(fermer);
  useEffect(() => {
    rappel.current = fermer;
  });
  useEffect(() => {
    if (!ouverte) return;
    const entree = { id: ++compteurFeuilles, fermer: () => rappel.current() };
    pileFeuilles.push(entree);
    dansHistorique.push(entree.id);
    // L'état de Next est gardé (sinon son routeur recharge la page au retour).
    window.history.pushState({ ...(window.history.state ?? {}), feuille: entree.id }, "");
    if (!ecouteRetour) {
      window.addEventListener("popstate", surRetourNavigateur);
      ecouteRetour = true;
    }
    return () => {
      const rang = pileFeuilles.indexOf(entree);
      if (rang < 0) return; // déjà fermée par le geste retour
      pileFeuilles.splice(rang, 1);
      if (!synchronisationPrevue) {
        synchronisationPrevue = true;
        window.setTimeout(synchroniserHistorique, 0);
      }
    };
  }, [ouverte]);
}

/**
 * Une feuille plein écran pensée pour le pouce : rien d'interactif sous la
 * barre d'état, le bouton qui ferme en bas, glisser vers le bas pour fermer
 * (depuis le haut du contenu), le geste retour du téléphone aussi.
 */
export function Feuille({
  ouverte,
  onFermer,
  titre,
  sousTitre,
  children,
  pied,
  libelleFermer = "Fermer",
  sombre = false,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  sousTitre?: ReactNode;
  children: ReactNode;
  pied?: ReactNode;
  libelleFermer?: string;
  sombre?: boolean;
}) {
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
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Échap ferme la feuille du dessus, pas celle qu'elle recouvre.
    const surTouche = (e: KeyboardEvent) => {
      const feuilles = document.querySelectorAll("[data-feuille]");
      if (e.key === "Escape" && feuilles[feuilles.length - 1] === boite.current) fermeture.current();
    };
    window.addEventListener("keydown", surTouche);
    boite.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", surTouche);
    };
  }, [ouverte]);

  if (!ouverte || typeof document === "undefined") return null;

  const fond = sombre ? "bg-[#111110] text-white" : "bg-[#F5F4F1] text-[#1A1A1A]";
  return createPortal(
    <div
      ref={boite}
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      data-feuille=""
      tabIndex={-1}
      className={cx("fixed inset-0 z-50 flex flex-col outline-none [color-scheme:light]", fond)}
      style={{ transform: decalage ? `translateY(${decalage}px)` : undefined, transition: decalage ? "none" : "transform 180ms ease-out" }}
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
        <span aria-hidden className={cx("mx-auto mb-2 block h-1.5 w-10 rounded-full", sombre ? "bg-white/25" : "bg-[#D3CFC8]")} />
        <h2 className="font-display text-[22px] leading-tight font-semibold tracking-tight text-balance">{titre}</h2>
        {sousTitre ? <div className={cx("mt-1 text-[15px] leading-snug", sombre ? "text-white/70" : "text-[#5F5A53]")}>{sousTitre}</div> : null}
      </div>
      <div ref={defilement} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-xl px-4 pb-4">{children}</div>
      </div>
      <div className={cx("shrink-0 border-t", sombre ? "border-white/10 bg-[#111110]" : "border-[#E6E3DD] bg-white")}>
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {pied}
          <button
            type="button"
            onClick={onFermer}
            className={cx(
              "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[16.5px] font-semibold",
              sombre ? "bg-white/12 text-white active:bg-white/20" : "border border-[#D3CFC8] bg-white text-[#1A1A1A] active:bg-[#F2F0EC]",
              FOCUS
            )}
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
