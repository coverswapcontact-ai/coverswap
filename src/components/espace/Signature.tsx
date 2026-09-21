"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

/**
 * Signature au doigt : un trait lissé, net sur écran Retina, effaçable. Rend
 * une image PNG (fond transparent) quand quelque chose a été tracé.
 */
export type SignatureRef = { image: () => string | null; effacer: () => void };

export function Signature({ ref, onChange }: { ref?: Ref<SignatureRef>; onChange?: (signe: boolean) => void }) {
  const toile = useRef<HTMLCanvasElement>(null);
  const [signe, setSigne] = useState(false);
  const dessin = useRef<{ actif: boolean; points: { x: number; y: number }[] }>({ actif: false, points: [] });

  const preparer = useCallback(() => {
    const c = toile.current;
    if (!c) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const { width, height } = c.getBoundingClientRect();
    c.width = Math.round(width * ratio);
    c.height = Math.round(height * ratio);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#1A1A1A";
  }, []);

  useEffect(() => {
    preparer();
  }, [preparer]);

  const effacer = useCallback(() => {
    const c = toile.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setSigne(false);
    onChange?.(false);
  }, [onChange]);

  useImperativeHandle(ref, () => ({ image: () => (signe && toile.current ? toile.current.toDataURL("image/png") : null), effacer }), [signe, effacer]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  return (
    <div>
      <div className="relative rounded-2xl border-2 border-dashed border-[#BDB8B0] bg-white">
        <canvas
          ref={toile}
          className="block h-40 w-full touch-none rounded-2xl"
          aria-label="Zone de signature&nbsp;: signez avec le doigt"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dessin.current = { actif: true, points: [point(e)] };
          }}
          onPointerMove={(e) => {
            if (!dessin.current.actif) return;
            const ctx = e.currentTarget.getContext("2d");
            const p = point(e);
            const pts = dessin.current.points;
            pts.push(p);
            if (!ctx || pts.length < 3) return;
            // Courbe lissée passant par les milieux : un trait de stylo, pas une ligne brisée.
            const [a, b, c] = pts.slice(-3);
            ctx.beginPath();
            ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
            ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
            ctx.stroke();
            if (!signe) {
              setSigne(true);
              onChange?.(true);
            }
          }}
          onPointerUp={() => (dessin.current.actif = false)}
          onPointerCancel={() => (dessin.current.actif = false)}
        />
        {!signe ? <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[16px] text-[#8A857E]">Signez ici avec le doigt</span> : null}
        <span className="pointer-events-none absolute right-6 bottom-9 left-6 border-b border-[#D3CFC8]" aria-hidden />
      </div>
      {signe ? (
        <button type="button" onClick={effacer} className="mt-1.5 min-h-[40px] px-1 text-[15px] font-medium text-[#4F4A44] underline underline-offset-4">
          Effacer et recommencer
        </button>
      ) : null}
    </div>
  );
}
