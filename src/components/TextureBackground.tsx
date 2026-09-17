"use client";

import { useEffect, useRef } from "react";
import { fondSrc, fondSrcSet } from "@/lib/images";

interface TextureBackgroundProps {
  /** Photo de fond locale : `/images/fonds/<id>` (paire 800/1600, voir lib/images) */
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

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (imgRef.current) {
          imgRef.current.style.transform = `translateY(${window.scrollY * 0.32}px)`;
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [parallax]);

  return (
    <>
      {/* ── Image texture pleine section (fichiers locaux, sans optimiseur Vercel) ── */}
      <div
        ref={imgRef}
        className="absolute inset-0 select-none pointer-events-none"
        style={parallax ? { willChange: "transform", transform: "translateY(0px)" } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fondSrc(src, 1600)}
          srcSet={fondSrcSet(src)}
          sizes="100vw"
          alt={alt}
          loading={parallax ? "eager" : "lazy"}
          fetchPriority={parallax ? "high" : "auto"}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover ${parallax ? "scale-[1.15]" : ""}`}
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
