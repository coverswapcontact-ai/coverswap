"use client";

import { AvantApres as AvantApresPartage } from "@/components/simulation/AvantApres";

/**
 * Mission 15 (partie 4) : le curseur avant / après vit dans
 * `components/simulation/AvantApres` (partagé avec le simulateur du site). L'espace
 * client le garde sans ses outils (« Comparer », « Plein écran ») jusqu'à la
 * partie 6, qui reprend ses écrans avec les mêmes composants.
 */
export function AvantApres(props: { apres: string; avant: string | null; alt: string; className?: string; ratio?: string }) {
  return <AvantApresPartage {...props} sansOutils />;
}
