"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Fond vidéo pour le hero — autoplay, muted, plein écran.
 *
 * Stratégie :
 * - Mobile → vidéo MP4 en autoplay (muted + playsInline = autorisé iOS/Android)
 *   avec object-position center pour cadrer le sujet sur écran vertical.
 * - Desktop → même vidéo, object-cover classique.
 * - Fallback poster si la vidéo ne charge pas.
 *
 * Hydration fix : on ne rend rien jusqu'au mount côté client.
 */
export default function HeroVideo() {
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {mounted && !videoError ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover object-center"
          src="/videos/hero.mp4"
          poster="/videos/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setVideoError(true)}
        />
      ) : (
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
