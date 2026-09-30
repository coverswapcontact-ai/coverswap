import type { ReactNode } from "react";

/**
 * La pastille de texte posée sur une image (mission 16) : « Simulation »
 * (un rendu du moteur), « Ambiance » (une image d'illustration, jamais un
 * chantier), « Avant », « Après ». UN seul dessin pour le site, le simulateur
 * et l'espace : celui des pastilles du curseur avant / après de la mission 15
 * (`AvantApres` la rend), 12,5 px, sans ombre. Deux tons : `clair` (le fond
 * blanc à 85 %, l'encre) par défaut, `sombre` (l'encre à 70 %, le blanc) pour
 * « Avant ».
 */
export type TexteEtiquette = "Simulation" | "Ambiance" | "Avant" | "Après";

const TONS = {
  clair: "bg-white/85 text-encre",
  sombre: "bg-encre/70 text-blanc",
};

export function Etiquette({ children, ton = "clair", className }: { children: TexteEtiquette | ReactNode; ton?: keyof typeof TONS; className?: string }) {
  return <span className={`inline-flex items-center rounded-[4px] px-2 py-1 text-[12.5px] font-medium ${TONS[ton]}${className ? ` ${className}` : ""}`}>{children}</span>;
}
