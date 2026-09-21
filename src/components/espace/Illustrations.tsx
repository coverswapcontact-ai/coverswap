/**
 * Dessins au trait de l'espace client : une cuisine vue de face (pour dire
 * quoi photographier et ce que l'on recouvre) et des plans vus de dessus (pour
 * estimer la longueur de meubles). Un seul dessin, des zones qui s'allument :
 * le client reconnaît sa cuisine, pas un schéma technique.
 */

const TRAIT = "#1A1A1A";
const MEUBLE = "#ECEAE5";
const ROUGE = "#CC0000";
const ROUGE_FOND = "rgba(204,0,0,0.16)";

export type ZoneCuisine = "meubles-hauts" | "meubles-bas" | "plan-de-travail" | "credence";

/** Cuisine de face ; `allume` : zones recouvertes (fond rouge léger) ; `cadre` : ce que la photo doit contenir. */
export function CuisineDeFace({ allume = [], cadre, className }: { allume?: string[]; cadre?: "ensemble" | "hauts" | "bas" | "plan" | "detail"; className?: string }) {
  const on = (zone: ZoneCuisine) => allume.includes(zone);
  const cadres: Record<string, { x: number; y: number; w: number; h: number }> = {
    ensemble: { x: 3, y: 3, w: 114, h: 86 },
    hauts: { x: 5, y: 5, w: 110, h: 31 },
    bas: { x: 5, y: 50, w: 110, h: 39 },
    plan: { x: 4, y: 40, w: 112, h: 20 },
    detail: { x: 60, y: 57, w: 26, h: 22 },
  };
  const c = cadre ? cadres[cadre] : null;
  return (
    <svg viewBox="0 0 120 92" className={className} aria-hidden fill="none" strokeLinejoin="round" strokeLinecap="round">
      {/* Mur, crédence */}
      <rect x="8" y="32" width="104" height="20" fill={on("credence") ? ROUGE_FOND : "#F7F6F3"} stroke={on("credence") ? ROUGE : "#CFCBC4"} strokeWidth="0.8" strokeDasharray={on("credence") ? undefined : "2 2"} />
      {/* Meubles hauts */}
      {[
        [8, 21],
        [29, 21],
        [74, 19],
        [93, 19],
      ].map(([x, w]) => (
        <g key={`h${x}`}>
          <rect x={x} y="8" width={w} height="24" rx="0.8" fill={on("meubles-hauts") ? ROUGE_FOND : MEUBLE} stroke={on("meubles-hauts") ? ROUGE : TRAIT} strokeWidth="1.1" />
          <line x1={x + w / 2 + (x < 60 ? 6 : -6)} y1="25" x2={x + w / 2 + (x < 60 ? 6 : -6)} y2="29" stroke={TRAIT} strokeWidth="1.1" />
        </g>
      ))}
      {/* Hotte */}
      <path d="M56 8 h12 v10 l5 8 h-22 l5 -8 z" fill="#F7F6F3" stroke={TRAIT} strokeWidth="1.1" />
      {/* Plan de travail */}
      <rect x="6" y="52" width="108" height="4" rx="0.6" fill={on("plan-de-travail") ? "rgba(204,0,0,0.28)" : "#D9D5CE"} stroke={on("plan-de-travail") ? ROUGE : TRAIT} strokeWidth="1.1" />
      {/* Évier et robinet */}
      <path d="M36 52 v-6 q0 -3 3 -3 h3" stroke={TRAIT} strokeWidth="1.1" />
      <rect x="31" y="51" width="14" height="1.6" fill="#BDB8B0" />
      {/* Meubles bas */}
      {[
        [8, 26],
        [34, 26],
        [60, 26],
      ].map(([x, w]) => (
        <g key={`b${x}`}>
          <rect x={x} y="56" width={w} height="28" rx="0.8" fill={on("meubles-bas") ? ROUGE_FOND : MEUBLE} stroke={on("meubles-bas") ? ROUGE : TRAIT} strokeWidth="1.1" />
          <line x1={x + w - 5} y1="60" x2={x + w - 5} y2="66" stroke={TRAIT} strokeWidth="1.1" />
        </g>
      ))}
      {[56, 65.3, 74.6].map((y) => (
        <g key={`t${y}`}>
          <rect x="86" y={y} width="26" height="9.3" rx="0.8" fill={on("meubles-bas") ? ROUGE_FOND : MEUBLE} stroke={on("meubles-bas") ? ROUGE : TRAIT} strokeWidth="1.1" />
          <line x1="95" y1={y + 3} x2="103" y2={y + 3} stroke={TRAIT} strokeWidth="1.1" />
        </g>
      ))}
      {/* Plinthe, sol */}
      <line x1="8" y1="86" x2="112" y2="86" stroke="#9C978F" strokeWidth="1" />
      {c ? <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="2.5" stroke={ROUGE} strokeWidth="1.6" strokeDasharray="4 3" /> : null}
    </svg>
  );
}

/** Plans vus de dessus, pour estimer la longueur de meubles. */
export function PlanCuisine({ forme, className }: { forme: "une-rangee" | "en-l" | "en-u" | "ilot"; className?: string }) {
  const meuble = { fill: MEUBLE, stroke: TRAIT, strokeWidth: 1.4 };
  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden fill="none">
      <rect x="4" y="4" width="56" height="40" rx="2" stroke="#CFCBC4" strokeWidth="1" strokeDasharray="2 2" />
      {forme === "une-rangee" ? <rect x="8" y="8" width="48" height="9" rx="1" {...meuble} /> : null}
      {forme === "en-l" ? (
        <>
          <rect x="8" y="8" width="48" height="9" rx="1" {...meuble} />
          <rect x="8" y="17" width="9" height="22" rx="1" {...meuble} />
        </>
      ) : null}
      {forme === "en-u" ? (
        <>
          <rect x="8" y="8" width="48" height="9" rx="1" {...meuble} />
          <rect x="8" y="17" width="9" height="22" rx="1" {...meuble} />
          <rect x="47" y="17" width="9" height="22" rx="1" {...meuble} />
        </>
      ) : null}
      {forme === "ilot" ? (
        <>
          <rect x="8" y="8" width="48" height="9" rx="1" {...meuble} />
          <rect x="8" y="17" width="9" height="22" rx="1" {...meuble} />
          <rect x="26" y="27" width="24" height="10" rx="1" {...meuble} />
        </>
      ) : null}
    </svg>
  );
}

/** Le logo CoverSwap : le carré rouge, le « C », le mot. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="relative h-8 w-8" aria-hidden>
        <span className="absolute inset-[3px] rotate-45 rounded-[6px] bg-[#CC0000]" />
        <span className="absolute inset-0 flex items-center justify-center font-display text-[15px] font-bold text-white">C</span>
      </span>
      <span className="font-display text-[19px] font-bold tracking-tight text-[#1A1A1A]">
        Cover<span className="text-[#CC0000]">Swap</span>
      </span>
    </span>
  );
}

export const IconeTelephone = ({ taille = 18 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconeAppareil = ({ taille = 20 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const IconeGalerie = ({ taille = 20 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </svg>
);

export const IconeCoche = ({ taille = 14 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconeRetour = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const IconeSuite = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
