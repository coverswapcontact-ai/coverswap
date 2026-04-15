"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Fond vidéo hero — autoplay muted, lecture unique (pas de loop).
 * Le poster s'affiche immédiatement (pas de flash au mount).
 * La vidéo se charge côté client et remplace le poster une fois prête.
 */
export default function HeroVideo() {
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Sauter la 1ʳᵉ seconde dès que la vidéo est prête */
  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = 1;
      v.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    setShowVideo(true);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Poster toujours présent — visible tant que la vidéo n'a pas chargé */}
      <div
        className="absolute inset-0 w-full h-full bg-center bg-cover"
        style={{ backgroundImage: "url(/videos/hero-poster.jpg)" }}
        aria-hidden="true"
      />

      {/* Vidéo par-dessus le poster — lecture unique, pas de loop */}
      {showVideo && !videoError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover object-center"
          src="/videos/hero.mp4"
          autoPlay
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setVideoError(true)}
        />
      )}

      {/* Overlay — plus sombre sur mobile pour lisibilité texte */}
      <div className="absolute inset-0 bg-noir/60 md:bg-noir/50 pointer-events-none" />
    </div>
  );
}
