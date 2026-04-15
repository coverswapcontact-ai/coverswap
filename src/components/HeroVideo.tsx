"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Fond vidéo hero — stratégie anti-flash multi-couches :
 * 1. Conteneur avec background-image CSS = poster affiché dès le 1er rendu SSR
 * 2. Vidéo superposée avec attribut poster (fallback natif)
 * 3. play() forcé via ref (contourne les quirks autoplay mobile iOS/Android)
 */
export default function HeroVideo() {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Force le play dès que l'élément est dans le DOM — plus fiable que autoPlay seul */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.play().catch(() => {
        /* Si bloqué (ex: mode éco), on laisse le poster */
      });
    };
    // Tentative immédiate + retry sur canplay
    tryPlay();
    v.addEventListener("canplay", tryPlay, { once: true });
    return () => v.removeEventListener("canplay", tryPlay);
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }}
    >
      {!videoError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover object-center"
          src="/videos/hero.mp4"
          poster="/videos/hero-poster.jpg"
          autoPlay
          muted
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
