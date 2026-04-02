"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface TextureBackgroundProps {
  /** URL directe Unsplash (images.unsplash.com) */
  src: string;
  /** Couleur de l'overlay CSS (rgba). Défaut : rgba(0,0,0,0.78) */
  overlay?: string;
  /** Active le parallax JS au scroll (uniquement pour le Hero) */
  parallax?: boolean;
  /** Dégradé de transition en haut de section */
  fadeTop?: boolean;
  /** Dégradé de transition en bas de section */
  fadeBottom?: boolean;
  /** Alt pour l'accessibilité (vide = décoratif) */
  alt?: string;
}

export default function TextureBackground({
  src,
  overlay = "rgba(0,0,0,0.78)",
  parallax = false,
  fadeTop = true,
  fadeBottom = true,
  alt = "",
}: TextureBackgroundProps) {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parallax || !imgRef.current) return;

    const handleScroll = () => {
      if (!imgRef.current) return;
      imgRef.current.style.transform = `translateY(${window.scrollY * 0.32}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [parallax]);

  return (
    <>
      {/* ── Image texture pleine section ── */}
      <div
        ref={imgRef}
        className="absolute inset-0 select-none pointer-events-none"
        style={parallax ? { willChange: "transform", transform: "translateY(0px)" } : undefined}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          priority={parallax}
          quality={80}
          className={`object-cover ${parallax ? "scale-[1.15]" : ""}`}
        />
      </div>

      {/* ── Overlay sombre pour lisibilité ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: overlay }}
        aria-hidden="true"
      />

      {/* ── Transition gradient haut ── */}
      {fadeTop && (
        <div
          className="absolute inset-x-0 top-0 h-20 pointer-events-none z-10"
          style={{ background: "linear-gradient(to bottom, #1a1a1a, transparent)" }}
          aria-hidden="true"
        />
      )}

      {/* ── Transition gradient bas ── */}
      {fadeBottom && (
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-10"
          style={{ background: "linear-gradient(to top, #1a1a1a, transparent)" }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
