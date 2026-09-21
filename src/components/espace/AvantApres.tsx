"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Avant / après sur la photo du client : la simulation recouvre la photo, un
 * curseur à glisser révèle l'une ou l'autre. C'est l'effet qui décide.
 * Au doigt (glisser n'importe où sur l'image), à la souris, au clavier
 * (flèches) ; sans photo « avant », seule la simulation s'affiche.
 */
export function AvantApres({ apres, avant, alt, className }: { apres: string; avant: string | null; alt: string; className?: string }) {
  const [position, setPosition] = useState(50);
  const [touche, setTouche] = useState(false);
  const boite = useRef<HTMLDivElement>(null);

  const suivre = useCallback((clientX: number) => {
    const rect = boite.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  if (!avant) {
    return (
      <div className={`overflow-hidden rounded-2xl bg-[#ECEAE5] ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par le CRM, pas d'optimisation */}
        <img src={apres} alt={alt} className="block w-full" loading="lazy" referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <div
      ref={boite}
      className={`relative touch-pan-y overflow-hidden rounded-2xl bg-[#ECEAE5] select-none ${className ?? ""}`}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setTouche(true);
        suivre(e.clientX);
      }}
      onPointerMove={(e) => {
        if (touche) suivre(e.clientX);
      }}
      onPointerUp={() => setTouche(false)}
      onPointerCancel={() => setTouche(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par le CRM */}
      <img src={apres} alt={alt} className="block w-full" draggable={false} loading="lazy" referrerPolicy="no-referrer" />
      {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par le CRM */}
      <img
        src={avant}
        alt="Votre pièce aujourd'hui"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[12.5px] font-semibold text-white">Avant</span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-[#CC0000] px-2.5 py-1 text-[12.5px] font-semibold text-white">Après</span>
      <div className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.35)]" style={{ left: `${position}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Comparer avant et après"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={position < 15 ? "Après" : position > 85 ? "Avant" : "Moitié avant, moitié après"}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 5));
          if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 5));
        }}
        className="absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1A1A1A] shadow-[0_2px_10px_rgba(0,0,0,0.3)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#CC0000]"
        style={{ left: `${position}%` }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 18-6-6 6-6" />
          <path d="m15 6 6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}
