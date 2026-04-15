"use client";

import { useState, useRef } from "react";

/**
 * Fond vidéo hero — autoplay muted, lecture unique.
 * Le poster est natif (attribut poster) → zéro flash.
 * La vidéo se charge immédiatement (preload auto, pas de gate useState).
 */
export default function HeroVideo() {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Vidéo avec poster natif — pas de délai, pas de flash */}
      {!videoError ? (
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
      ) : (
        /* Fallback poster si la vidéo échoue */
        <div
          className="absolute inset-0 w-full h-full bg-center bg-cover"
          style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }}
          aria-hidden="true"
        />
      )}

      {/* Overlay — plus sombre sur mobile pour lisibilité texte */}
      <div className="absolute inset-0 bg-noir/60 md:bg-noir/50 pointer-events-none" />
    </div>
  );
}
