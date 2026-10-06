import type { ReactNode } from "react";

/**
 * La pastille de texte posée sur une image (mission 16) : l'ÉTIQUETTE
 * D'HONNÊTETÉ. « Simulation » (un rendu du simulateur, rien d'autre),
 * « Ambiance » (une image générée, jamais un chantier), « Ambiance · avant /
 * après » (un avant / après généré, site 3.0), « Réalisation » (un vrai
 * chantier, toujours montré en premier), « Démonstration » (mission 22 : l'affiche de la démo du simulateur, qui
 * montre l'outil, pas un chantier), « Avant », « Après ». UN seul dessin pour le site, le simulateur
 * et l'espace : celui des pastilles du curseur avant / après de la mission 15
 * (`AvantApres` la rend), 12,5 px, sans ombre. Deux tons : `clair` (le fond
 * blanc à 85 %, l'encre) par défaut, `sombre` (l'encre à 70 %, le blanc) pour
 * « Avant ».
 */
export type TexteEtiquette = "Simulation" | "Ambiance" | "Ambiance · avant / après" | "Réalisation" | "Démonstration" | "Avant" | "Après";

/** Les textes permis, dans l'ordre de docs/DESIGN.md (« L'étiquette d'honnêteté »). */
export const TEXTES_ETIQUETTE: readonly TexteEtiquette[] = ["Réalisation", "Simulation", "Ambiance", "Ambiance · avant / après", "Démonstration", "Avant", "Après"];

const TONS = {
  clair: "bg-white/85 text-encre",
  sombre: "bg-encre/70 text-blanc",
};

/** `muette` : posée sur une image décorative (`alt=""`), la pastille est cachée aux lecteurs d'écran (`aria-hidden`). */
export function Etiquette({ children, ton = "clair", className, muette = false }: { children: TexteEtiquette | ReactNode; ton?: keyof typeof TONS; className?: string; muette?: boolean }) {
  return (
    <span aria-hidden={muette || undefined} className={`inline-flex items-center rounded-[4px] px-2 py-1 text-[12.5px] font-medium ${TONS[ton]}${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
