"use client";

import { useCallback, useRef, useState } from "react";
import { PleinEcran } from "./PleinEcran";

/**
 * Avant / après sur la photo du visiteur (mission 15, partie 4 ; déplacé
 * depuis l'espace client, qui l'importe d'ici) : la simulation en plein
 * cadre au rapport de l'image, la photo d'origine par-dessus, découpée par
 * un curseur. Le curseur se glisse depuis sa POIGNÉE (`touch-action: none`
 * dessus seulement : ailleurs, la page défile normalement au doigt), à la
 * souris, au clavier (flèches, Début, Fin). « Comparer » alterne entre tout
 * avant et tout après ; « Plein écran » ouvre l'image à pincer.
 */
export function AvantApres({ apres, avant, alt, className, ratio, sansOutils = false }: { apres: string; avant: string | null; alt: string; className?: string; ratio?: string; sansOutils?: boolean }) {
  const [position, setPosition] = useState(50);
  const [glisse, setGlisse] = useState(false);
  const [pleinEcran, setPleinEcran] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const reserve = ratio ? { aspectRatio: ratio } : undefined;

  const suivre = useCallback((clientX: number) => {
    const rect = boite.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const outils = sansOutils ? null : (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {avant ? (
        <button type="button" onClick={() => setPosition((p) => (p > 50 ? 0 : 100))} className="min-h-[44px] rounded-[var(--rayon-sm)] border border-trait bg-white px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] active:bg-fond-2">
          Comparer
        </button>
      ) : null}
      <button type="button" onClick={() => setPleinEcran(true)} className="min-h-[44px] rounded-[var(--rayon-sm)] border border-trait bg-white px-4 text-[15px] font-medium text-encre transition-colors duration-[var(--duree-courte)] active:bg-fond-2">
        Plein écran
      </button>
      <PleinEcran ouvert={pleinEcran} onFermer={() => setPleinEcran(false)} apres={apres} avant={avant} alt={alt} />
    </div>
  );

  if (!avant) {
    return (
      <div className={className}>
        <div className="overflow-hidden rounded-[var(--rayon-md)] bg-fond-2" style={reserve}>
          {/* eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM, pas d'optimisation */}
          <img src={apres} alt={alt} className="block w-full" loading="lazy" referrerPolicy="no-referrer" />
        </div>
        {outils}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={boite}
        className="relative touch-pan-y overflow-hidden rounded-[var(--rayon-md)] bg-fond-2 select-none"
        style={reserve}
        onClick={(e) => {
          // Un toucher sur l'image place le curseur là ; le glissement se fait depuis la poignée.
          if (!glisse) suivre(e.clientX);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM */}
        <img src={apres} alt={alt} className="block w-full" draggable={false} loading="lazy" referrerPolicy="no-referrer" />
        {/* eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM */}
        <img
          src={avant}
          alt="Votre pièce aujourd'hui"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)`, transition: glisse ? "none" : "clip-path var(--duree-moyenne) var(--ease)" }}
          draggable={false}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <span className="pointer-events-none absolute top-3 left-3 rounded-[4px] bg-encre/70 px-2 py-1 text-[12.5px] font-medium text-white">Avant</span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-[4px] bg-white/85 px-2 py-1 text-[12.5px] font-medium text-encre">Après</span>
        <div className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_4px_rgba(0,0,0,0.35)]" style={{ left: `${position}%`, transition: glisse ? "none" : "left var(--duree-moyenne) var(--ease)" }} />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparer avant et après"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={position < 15 ? "Après" : position > 85 ? "Avant" : "Moitié avant, moitié après"}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            setGlisse(true);
            suivre(e.clientX);
          }}
          onPointerMove={(e) => {
            if (glisse) suivre(e.clientX);
          }}
          onPointerUp={() => setGlisse(false)}
          onPointerCancel={() => setGlisse(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
            if (e.key === "Home") setPosition(0);
            if (e.key === "End") setPosition(100);
          }}
          className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full bg-white text-encre shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
          style={{ left: `${position}%`, transition: glisse ? "none" : "left var(--duree-moyenne) var(--ease)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 18-6-6 6-6" />
            <path d="m15 6 6 6-6 6" />
          </svg>
        </div>
      </div>
      {outils}
    </div>
  );
}
