"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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

/**
 * Un geste qui DÉFAIT quelque chose (retirer une photo, annuler une validation,
 * retirer un accord) : un bouton évident, une confirmation courte sur place
 * (pas de fenêtre, pas de menu caché), qui se referme seule au bout de
 * quelques secondes si on ne confirme pas.
 */
export function BoutonAConfirmer({ libelle, question, confirmer = "Oui", onConfirme, occupe = false, className }: { libelle: ReactNode; question: string; confirmer?: string; onConfirme: () => void; occupe?: boolean; className?: string }) {
  const [demande, setDemande] = useState(false);
  useEffect(() => {
    if (!demande) return;
    const t = window.setTimeout(() => setDemande(false), 20000);
    return () => window.clearTimeout(t);
  }, [demande]);
  if (!demande)
    return (
      <button type="button" disabled={occupe} onClick={() => setDemande(true)} className={cx("flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-[15.5px] font-medium text-[#4F4A44] underline decoration-[#BDB8B0] underline-offset-4 active:bg-[#F2F0EC] disabled:opacity-50", FOCUS, className)}>
        {libelle}
      </button>
    );
  return (
    <div role="group" aria-label={question} className={cx("rounded-2xl border border-[#D3CFC8] bg-white p-3", className)}>
      <p className="px-1 text-[15.5px] leading-snug font-semibold text-[#1A1A1A]">{question}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setDemande(false)} className={cx("min-h-[48px] rounded-xl border border-[#D3CFC8] bg-white text-[15.5px] font-medium text-[#1A1A1A] active:bg-[#F2F0EC]", FOCUS)}>
          Non
        </button>
        <button
          type="button"
          disabled={occupe}
          onClick={() => {
            setDemande(false);
            onConfirme();
          }}
          className={cx("min-h-[48px] rounded-xl bg-[#1A1A1A] text-[15.5px] font-semibold text-white active:bg-[#333] disabled:opacity-50", FOCUS)}
        >
          {occupe ? "Un instant…" : confirmer}
        </button>
      </div>
    </div>
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
 * Mission 15 (partie 4) : la feuille et son lien à l'historique vivent dans
 * `components/simulation/Feuille` (partagés avec le simulateur du site) — le
 * corps de la page y est verrouillé par `position: fixed` avec la position
 * restaurée à la fermeture, la barre de défilement compensée, le z-index
 * au-dessus de l'en-tête du site. Même signature qu'avant pour l'espace.
 */
export { Feuille, useRetourNavigateur } from "@/components/simulation/Feuille";
