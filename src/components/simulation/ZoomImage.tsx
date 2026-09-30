"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Une image qu'on pince pour zoomer et qu'on déplace au doigt (ou à la molette
 * et à la souris) : la vue agrandie d'un échantillon et le plein écran d'un
 * rendu (mission 15, partie 4). Deux pointeurs = zoom + déplacement ; un
 * pointeur = déplacement ; double toucher = retour à l'échelle 1. Sans
 * dépendance, `touch-action: none` sur la zone seulement.
 *
 * `retenirMolette` (mission 16, partie 5 : le plein écran modal de la page
 * Matières) : la molette (et le pincement du pavé tactile) ne fait QUE zoomer.
 * React pose « wheel » en écouteur passif, où `preventDefault` ne peut rien :
 * l'écouteur est alors posé à la main, non passif. Sans l'option, rien ne change
 * (le catalogue en feuille garde sa molette qui fait aussi défiler).
 */
type Pointeur = { x: number; y: number };

const ECHELLE_MAX = 5;

export function ZoomImage({ src, alt, className, retenirMolette = false }: { src: string; alt: string; className?: string; retenirMolette?: boolean }) {
  const [transformation, setTransformation] = useState({ echelle: 1, x: 0, y: 0 });
  const [enMouvement, setEnMouvement] = useState(false);
  const pointeurs = useRef(new Map<number, Pointeur>());
  const repere = useRef<{ distance: number; centre: Pointeur; echelle: number; x: number; y: number } | null>(null);
  const dernierToucher = useRef(0);
  const cadre = useRef<HTMLDivElement>(null);

  const borner = useCallback((t: { echelle: number; x: number; y: number }) => {
    const echelle = Math.min(ECHELLE_MAX, Math.max(1, t.echelle));
    if (echelle === 1) return { echelle, x: 0, y: 0 };
    const rect = cadre.current?.getBoundingClientRect();
    const maxX = rect ? (rect.width * (echelle - 1)) / 2 : Infinity;
    const maxY = rect ? (rect.height * (echelle - 1)) / 2 : Infinity;
    return { echelle, x: Math.max(-maxX, Math.min(maxX, t.x)), y: Math.max(-maxY, Math.min(maxY, t.y)) };
  }, []);

  const zoomerALaMolette = useCallback((deltaY: number) => setTransformation((t) => borner({ ...t, echelle: t.echelle * (deltaY < 0 ? 1.15 : 0.87) })), [borner]);
  useEffect(() => {
    const zone = cadre.current;
    if (!retenirMolette || !zone) return;
    const surMolette = (e: WheelEvent) => {
      e.preventDefault();
      zoomerALaMolette(e.deltaY);
    };
    zone.addEventListener("wheel", surMolette, { passive: false });
    return () => zone.removeEventListener("wheel", surMolette);
  }, [retenirMolette, zoomerALaMolette]);

  const geometrie = () => {
    const [a, b] = [...pointeurs.current.values()];
    if (!a) return null;
    if (!b) return { distance: 0, centre: a };
    return { distance: Math.hypot(b.x - a.x, b.y - a.y), centre: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  return (
    <div
      ref={cadre}
      className={`relative touch-none overflow-hidden select-none ${className ?? ""}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        setEnMouvement(true);
        const g = geometrie();
        if (g) repere.current = { ...g, echelle: transformation.echelle, x: transformation.x, y: transformation.y };
        const maintenant = Date.now();
        if (pointeurs.current.size === 1 && maintenant - dernierToucher.current < 300) setTransformation({ echelle: 1, x: 0, y: 0 });
        dernierToucher.current = maintenant;
      }}
      onPointerMove={(e) => {
        if (!pointeurs.current.has(e.pointerId) || !repere.current) return;
        pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const g = geometrie();
        if (!g) return;
        const r = repere.current;
        const echelle = r.distance > 0 && g.distance > 0 ? r.echelle * (g.distance / r.distance) : r.echelle;
        setTransformation(borner({ echelle, x: r.x + (g.centre.x - r.centre.x), y: r.y + (g.centre.y - r.centre.y) }));
      }}
      onPointerUp={(e) => {
        pointeurs.current.delete(e.pointerId);
        const g = geometrie();
        repere.current = g ? { ...g, echelle: transformation.echelle, x: transformation.x, y: transformation.y } : null;
        if (pointeurs.current.size === 0) setEnMouvement(false);
      }}
      onPointerCancel={(e) => {
        pointeurs.current.delete(e.pointerId);
        repere.current = null;
        if (pointeurs.current.size === 0) setEnMouvement(false);
      }}
      onWheel={
        retenirMolette
          ? undefined
          : (e) => {
              e.preventDefault();
              zoomerALaMolette(e.deltaY);
            }
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- image servie par le CRM, non optimisée */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        referrerPolicy="no-referrer"
        className="block h-full w-full object-contain"
        style={{ transform: `translate(${transformation.x}px, ${transformation.y}px) scale(${transformation.echelle})`, transformOrigin: "center", transition: enMouvement ? "none" : "transform var(--duree-courte) var(--ease)" }}
      />
      <span className="sr-only">Pincez pour zoomer, touchez deux fois pour revenir à la taille normale.</span>
    </div>
  );
}
