"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { TEINTE_PRINCIPALE } from "@/components/simulation/Bouton";
import { IconeCadenas } from "./Illustrations";

/**
 * Briques visuelles de l'espace client. Fond clair, beaucoup d'air, une seule
 * action rouge par écran ; tout se touche au pouce (52 px au moins), tout se
 * lit sans zoom (17 px), contrastes AA.
 */

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

export const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";

export function BoutonPrincipal({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        `flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[17px] font-semibold transition-colors ${TEINTE_PRINCIPALE} disabled:bg-trait disabled:text-encre-2`,
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
      className={cx("flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-trait bg-blanc px-5 text-[16px] font-medium text-encre active:bg-fond-2 disabled:opacity-50", FOCUS, className)}
    >
      {children}
    </button>
  );
}

export function LienPrincipal({ children, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={cx("flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[17px] font-semibold", TEINTE_PRINCIPALE, FOCUS, className)}>
      {children}
    </a>
  );
}

export function Carte({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-[22px] border border-trait bg-blanc p-5 shadow-[0_1px_2px_rgba(26,26,26,0.04)]", className)}>{children}</section>;
}

export function Surtitre({ children, ton = "gris" }: { children: ReactNode; ton?: "gris" | "fort" | "vert" }) {
  return <p className={cx("text-[13px] font-semibold tracking-[0.08em] uppercase", ton === "fort" ? "text-encre" : ton === "vert" ? "text-succes" : "text-encre-2")}>{children}</p>;
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
        <h1 className="font-display text-[29px] leading-[1.12] font-semibold tracking-tight text-balance text-encre">{titre}</h1>
        {apres}
      </div>
      {phrase ? <p className="mt-2.5 text-[17px] leading-relaxed text-encre-2">{phrase}</p> : null}
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
        "relative flex w-full flex-col items-start gap-2 rounded-2xl border-2 bg-blanc p-3 text-left transition-colors",
        coche ? "border-encre bg-fond" : "border-trait active:bg-fond",
        FOCUS,
        className
      )}
    >
      {illustration}
      <span className="pr-7">
        <span className="block text-[16px] leading-snug font-semibold text-encre">{titre}</span>
        {aide ? <span className="mt-0.5 block text-[14px] leading-snug text-encre-2">{aide}</span> : null}
      </span>
      <span
        aria-hidden
        className={cx("absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[13px] font-bold", coche ? "border-encre bg-encre text-blanc" : "border-trait bg-blanc")}
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
        ton === "succes" ? "bg-succes-fond text-succes" : ton === "erreur" ? "bg-alerte-fond text-alerte-texte" : "bg-fond-2 text-encre"
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
            etat.etat === "ok" ? "bg-succes-fond text-succes" : etat.etat === "erreur" ? "bg-alerte-fond text-alerte-texte" : etat.etat === "attente" || etat.etat === "apercu" ? "bg-alerte-fond text-alerte-texte" : "bg-fond-2 text-encre-2"
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
      <button type="button" disabled={occupe} onClick={() => setDemande(true)} className={cx("flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-[15.5px] font-medium text-encre-2 underline decoration-trait underline-offset-4 active:bg-fond-2 disabled:opacity-50", FOCUS, className)}>
        {libelle}
      </button>
    );
  return (
    <div role="group" aria-label={question} className={cx("rounded-2xl border border-trait bg-blanc p-3", className)}>
      <p className="px-1 text-[15.5px] leading-snug font-semibold text-encre">{question}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setDemande(false)} className={cx("min-h-[48px] rounded-xl border border-trait bg-blanc text-[15.5px] font-medium text-encre active:bg-fond-2", FOCUS)}>
          Non
        </button>
        <button
          type="button"
          disabled={occupe}
          onClick={() => {
            setDemande(false);
            onConfirme();
          }}
          className={cx("min-h-[48px] rounded-xl bg-encre text-[15.5px] font-semibold text-blanc active:bg-encre-survol disabled:opacity-50", FOCUS)}
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
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-fond-2 text-encre" aria-hidden>
          <IconeCadenas taille={28} />
        </span>
        <p className="max-w-[20rem] text-[18.5px] leading-snug font-semibold text-balance text-encre">{raison}</p>
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
