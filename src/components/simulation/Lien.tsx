import Link from "@/components/LienSite";
import type { ComponentProps, ReactNode } from "react";
import { classesBouton, type VarianteBouton } from "./Bouton";

/**
 * Le bouton du site en lien (mission 16) : « Simuler ma cuisine » →
 * `/simulateur`, « Demander un devis » → `/contact`… Mêmes variantes, mêmes
 * classes que `Bouton` (`classesBouton`), cible de 48 px ; composant serveur
 * (aucun JavaScript de plus que le lien du site, `LienSite` : `next/link` au
 * préchargement différé, lot F7).
 */
export type ProprietesLien = Omit<ComponentProps<typeof Link>, "className" | "children"> & {
  variante?: VarianteBouton;
  /** Largeur pleine (mobile d'abord). */
  plein?: boolean;
  className?: string;
  children: ReactNode;
};

export function Lien({ variante = "principal", plein = false, className, children, ...props }: ProprietesLien) {
  return (
    <Link {...props} className={`${classesBouton(variante, plein)}${className ? ` ${className}` : ""}`}>
      {children}
    </Link>
  );
}
