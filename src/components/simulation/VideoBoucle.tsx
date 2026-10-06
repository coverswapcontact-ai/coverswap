"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { SourcesPhoto } from "@/lib/images-preparees";
import { adresseVideo, ratioVideo, type VideoSite } from "@/lib/videos";
import { CadrePhoto } from "./CadrePhoto";

/**
 * Une vidéo en boucle, muette (mission 22, partie B : le présentoir des matières, à droite du titre de `/matieres`).
 * L'affiche (`CadrePhoto`, AVIF préparé, étiquette d'honnêteté, place réservée au rapport du film) est rendue par le
 * serveur ; le `<video>` n'existe qu'une fois ces trois conditions réunies dans le navigateur :
 *  - le cadre est à l'écran (IntersectionObserver, un quart visible ; il repasse en pause quand il en sort) ;
 *  - la page a fini de charger (`load`) ET le visiteur a fait un premier geste (défilement, souris, toucher, clavier,
 *    molette ; ou le bouton « Lire ») : le film ne concurrence ni les images, ni le JavaScript du démarrage — créer un
 *    lecteur vidéo coûte jusqu'à 600 ms de fil principal sur un navigateur sans décodage matériel (mesuré en
 *    laboratoire : Lighthouse, Chrome sans GPU), et ce coût attend que la page réponde et que le visiteur bouge ;
 *  - le visiteur n'a pas demandé moins de mouvement (`prefers-reduced-motion`) : il voit alors l'affiche et un bouton
 *    « Lire », qui lance la boucle ; un bouton « Pause » l'arrête dans tous les cas (44 px, en bas à droite).
 * Ainsi aucun octet de vidéo ne part au premier affichage, et rien ne part hors écran. `autoplay muted loop
 * playsinline preload="none"` ; `muted` est posé en propriété avant `play()` (React ne l'écrit pas toujours en
 * attribut). Le film apparaît en fondu par-dessus l'affiche dès qu'il joue ; le bouton dit l'état réel (« Pause » quand
 * ça joue, « Lire » sinon). Les deux réglages du navigateur se lisent par `useSyncExternalStore` (rendu serveur :
 * inconnus), sans setState dans un effet.
 */
/** Les gestes qui comptent comme « le visiteur est là » (passifs, une seule fois). */
const GESTES = ["pointermove", "pointerdown", "touchstart", "keydown", "wheel", "scroll"] as const;
const MOINS_DE_MOUVEMENT = "(prefers-reduced-motion: reduce)";
const abonnerMouvement = (rappel: () => void) => {
  const media = window.matchMedia?.(MOINS_DE_MOUVEMENT);
  media?.addEventListener("change", rappel);
  return () => media?.removeEventListener("change", rappel);
};
/** « oui » / « non », ou « inconnu » côté serveur. */
const lireMouvement = (): "oui" | "non" => (window.matchMedia?.(MOINS_DE_MOUVEMENT).matches ? "oui" : "non");

const abonnerChargement = (rappel: () => void) => {
  window.addEventListener("load", rappel);
  return () => window.removeEventListener("load", rappel);
};
const lireChargement = () => document.readyState === "complete";

export function VideoBoucle({ video, affiche, libelle = "Lire", tailles, className, priorite = false, immediat = false }: { video: VideoSite; affiche: SourcesPhoto | null; libelle?: string; tailles?: string; className?: string; priorite?: boolean; immediat?: boolean }) {
  const mouvement = useSyncExternalStore(abonnerMouvement, lireMouvement, () => "inconnu" as const);
  const chargee = useSyncExternalStore(abonnerChargement, lireChargement, () => false);
  // Ce que veut le visiteur : `null` tant qu'il n'a rien dit (lire, sauf moins de mouvement), puis son choix.
  const [choix, setChoix] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [geste, setGeste] = useState(false);
  const [joue, setJoue] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  const lecture = choix ?? mouvement === "non";
  const active = lecture && visible && chargee && geste;
  // Le `<video>` n'est monté qu'à la première lecture ; ensuite il reste, et joue ou s'arrête selon l'écran et le visiteur.
  const [montee, setMontee] = useState(false);
  if (active && !montee) setMontee(true);

  useEffect(() => {
    if (geste) return;
    const marquer = () => setGeste(true);
    for (const e of GESTES) window.addEventListener(e, marquer, { passive: true, once: true });
    return () => {
      for (const e of GESTES) window.removeEventListener(e, marquer);
    };
  }, [geste]);

  useEffect(() => {
    const el = cadre.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observateur = new IntersectionObserver(([entree]) => setVisible(!!entree?.isIntersecting), { threshold: 0.25 });
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    const el = lecteur.current;
    if (!el) return;
    if (active) {
      el.muted = true;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [active, montee]);

  return (
    <div ref={cadre} className={`relative${className ? ` ${className}` : ""}`}>
      <CadrePhoto sources={affiche} ratio={ratioVideo(video)} alt="" etiquette={video.etiquette} tailles={tailles} priorite={priorite} immediat={immediat} className="rounded-[var(--rayon-md)]" />
      {montee ? (
        <video
          ref={lecteur}
          src={adresseVideo(video)}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onPlaying={() => setJoue(true)}
          onPause={() => setJoue(false)}
          className={`pointer-events-none absolute inset-0 h-full w-full rounded-[var(--rayon-md)] object-cover transition-opacity duration-[var(--duree-moyenne)] ${joue ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
      <button
        type="button"
        aria-pressed={joue}
        aria-label={joue ? `Mettre en pause : ${video.titre}` : `${libelle} : ${video.titre}`}
        onClick={() => {
          setChoix(!joue);
          setGeste(true);
        }}
        className="absolute right-3 bottom-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--rayon-sm)] bg-white/85 px-3 text-[13.5px] font-medium text-encre transition-colors duration-[var(--duree-courte)] active:bg-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {joue ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
        </svg>
        {joue ? "Pause" : libelle}
      </button>
    </div>
  );
}
