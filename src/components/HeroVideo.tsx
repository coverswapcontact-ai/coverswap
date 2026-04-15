"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Fond vidéo pour le hero — autoplay, muted, plein écran.
 *
 * Stratégie mobile :
 * - < 768px → poster uniquement (économie data + batterie).
 * - ≥ 768px → vidéo MP4 + poster, démarrage à 1 s pour
 *   couper le début statique de la vidéo.
 *
 * Hydration fix : on ne rend rien jusqu'au mount côté client
 * pour éviter un mismatch serveur/client sur isDesktop.
 */
export default function HeroVideo() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
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
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {mounted && isDesktop && !videoError ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/hero.mp4"
          poster="/videos/hero-poster.jpg"
          autoPlay
          muted
          playsInline
          preload="auto"
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

      {/* Overlay noir global */}
      <div className="absolute inset-0 bg-noir/50 pointer-events-none" />
    </div>
  );
}
