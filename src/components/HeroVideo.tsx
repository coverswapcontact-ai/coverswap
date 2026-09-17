"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Fond vidéo hero — le poster s'affiche dès le rendu serveur, la vidéo vient
 * ensuite, et seulement si elle en vaut la peine :
 *  - téléphone (< 768 px) : fichier 640 px (≈ 0,3 Mo) au lieu de la version bureau ;
 *  - « réduire les animations » ou « économiser les données » activés : poster seul.
 * Les deux fichiers sont muets (l'ancienne piste audio pesait pour rien).
 */
const VIDEO_BUREAU = "/videos/hero-1080.mp4";
const VIDEO_MOBILE = "/videos/hero-mobile.mp4";

export default function HeroVideo() {
  const [src, setSrc] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const economie = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    if (reduit || economie) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    // Choix fait après le montage (inconnu côté serveur) : lecture d'un état externe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(mobile ? VIDEO_MOBILE : VIDEO_BUREAU);
  }, []);

  /* Force le play dès que la source est posée — plus fiable que autoPlay seul sur mobile */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    const tryPlay = () => {
      v.play().catch(() => {
        /* bloqué (mode éco, etc.) : le poster reste */
      });
    };
    tryPlay();
    v.addEventListener("canplay", tryPlay, { once: true });
    return () => v.removeEventListener("canplay", tryPlay);
  }, [src]);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }}
    >
      {src && !videoError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover object-center"
          src={src}
          poster="/videos/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onError={() => setVideoError(true)}
        />
      )}

      {/* Overlay — plus sombre sur mobile pour lisibilité texte */}
      <div className="absolute inset-0 bg-noir/60 md:bg-noir/50 pointer-events-none" />
    </div>
  );
}
