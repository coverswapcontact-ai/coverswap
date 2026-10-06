"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { liberer, useRetourNavigateur, verrouillerLaPage } from "./Feuille";
import { ZoomImage } from "./ZoomImage";

/**
 * Plein écran d'un rendu (mission 15, partie 4) : l'image sur fond sombre, à
 * pincer pour zoomer ; « Avant / Après » quand la photo d'origine existe ;
 * fermeture par le bouton (44 px), Échap ou le geste retour.
 *
 * Mission 16 (partie 5), options pour la page Matières (« voir en grand » un
 * échantillon entier), sans effet sur le simulateur qui ne les passe pas :
 *  - `libelle` : le nom du dialogue (« Rendu en plein écran » par défaut) ;
 *  - `pied` : un bandeau clair sous l'image (nom, référence, bouton principal),
 *    au-dessus de la zone sûre du téléphone ;
 *  - `modale` : un vrai dialogue modal au-dessus d'une longue page — le focus
 *    va au bouton « Fermer » à l'ouverture, Tab et Maj+Tab restent dans le
 *    dialogue (le clavier n'atteint pas la page masquée), la page derrière est
 *    verrouillée comme sous une `Feuille` (ni la molette, ni le doigt sur le
 *    bandeau ne la font défiler ; la position revient intacte à la fermeture),
 *    et la molette ne fait que zoomer (`ZoomImage retenirMolette`).
 *
 * Mission 22 (partie B), `video` : le corps est un `<video controls autoplay playsinline>` (le film centré sur le fond
 * sombre, commandes natives) au lieu de l'image à pincer ; `apres` est alors son affiche (`poster`), `avant` reste
 * `null` (pas de bandeau Avant / Après). Muet par défaut ; le bouton « Son » de l'en-tête l'active (une voix off viendra
 * peut-être), jamais d'office. Le fichier n'est demandé qu'ici, à l'ouverture : rien ne part avec la page.
 */
type ProprietesPleinEcran = { ouvert: boolean; onFermer: () => void; apres: string; avant: string | null; alt: string; actions?: ReactNode; libelle?: string; pied?: ReactNode; modale?: boolean; video?: { src: string } };

const FOCUSABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Tab et Maj+Tab tournent dans `boite` : du dernier élément on revient au premier, et inversement ; un focus resté dehors y rentre. */
export function garderLeFocus(e: Pick<KeyboardEvent, "key" | "shiftKey" | "preventDefault">, boite: HTMLElement | null, actif: Element | null): void {
  if (e.key !== "Tab" || !boite) return;
  const elements = [...boite.querySelectorAll<HTMLElement>(FOCUSABLES)].filter((el) => el.getClientRects().length > 0);
  if (elements.length === 0) return;
  const premier = elements[0];
  const dernier = elements[elements.length - 1];
  const dedans = !!actif && boite.contains(actif);
  if (e.shiftKey && (!dedans || actif === premier)) {
    e.preventDefault();
    dernier.focus();
  } else if (!e.shiftKey && (!dedans || actif === dernier)) {
    e.preventDefault();
    premier.focus();
  }
}

export function PleinEcran(props: ProprietesPleinEcran) {
  // Remonté à chaque ouverture : l'état « avant / après » repart à « après » sans setState dans un effet.
  return props.ouvert ? <PleinEcranOuvert key={props.apres} {...props} /> : null;
}

function PleinEcranOuvert({ ouvert, onFermer, apres, avant, alt, actions, libelle = "Rendu en plein écran", pied, modale = false, video }: ProprietesPleinEcran) {
  useRetourNavigateur(ouvert, onFermer);
  const [montre, setMontre] = useState<"apres" | "avant">("apres");
  const [son, setSon] = useState(false);
  const lecteur = useRef<HTMLVideoElement>(null);
  // `muted` se pose en propriété (React ne l'écrit pas toujours en attribut) : avant la lecture, puis à chaque bascule.
  useEffect(() => {
    if (lecteur.current) lecteur.current.muted = !son;
  }, [son]);
  const boite = useRef<HTMLDivElement>(null);
  const boutonFermer = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert, onFermer]);
  // Modal : la page verrouillée derrière, le focus au bouton « Fermer », le clavier gardé dedans (rendu à la fermeture).
  useEffect(() => {
    if (!modale) return;
    verrouillerLaPage();
    boutonFermer.current?.focus({ preventScroll: true });
    const surTab = (e: KeyboardEvent) => garderLeFocus(e, boite.current, document.activeElement);
    window.addEventListener("keydown", surTab);
    return () => {
      window.removeEventListener("keydown", surTab);
      liberer();
    };
  }, [modale]);
  if (!ouvert || typeof document === "undefined") return null;
  return createPortal(
    <div ref={boite} role="dialog" aria-modal="true" aria-label={libelle} className="fixed inset-0 z-[80] flex flex-col bg-sombre text-blanc">
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
          {video ? (
            <button type="button" aria-pressed={son} onClick={() => setSon((s) => !s)} className="flex min-h-[44px] items-center gap-2 rounded-full bg-white/12 px-4 text-[14px] font-medium text-blanc transition-colors duration-[var(--duree-courte)] active:bg-white/25">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                {son ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 6 6M22 9l-6 6" />}
              </svg>
              {son ? "Son activé" : "Son"}
            </button>
          ) : null}
          {actions}
          <button ref={boutonFermer} type="button" onClick={onFermer} aria-label="Fermer le plein écran" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-blanc transition-colors duration-[var(--duree-courte)] active:bg-white/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`min-h-0 flex-1${pied ? "" : " pb-[env(safe-area-inset-bottom)]"}`}>
        {video ? (
          <div className="flex h-full w-full items-center justify-center px-2">
            <video ref={lecteur} src={video.src} poster={apres} controls autoPlay playsInline muted preload="auto" aria-label={alt} className="max-h-full max-w-full rounded-[var(--rayon-sm)] bg-sombre" />
          </div>
        ) : (
          <ZoomImage src={montre === "avant" && avant ? avant : apres} alt={montre === "avant" ? "Votre pièce aujourd'hui" : alt} className="h-full w-full" retenirMolette={modale} />
        )}
      </div>
      {pied ? <div className="shrink-0 bg-fond px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-encre">{pied}</div> : null}
    </div>,
    document.body
  );
}
