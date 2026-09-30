"use client";

import { usePathname } from "next/navigation";

/**
 * Mission 15 (partie 4) : le simulateur (/simulateur) est un parcours à part
 * entière, avec l'en-tête compact (retour à l'accueil) et un bouton principal
 * collé en bas. L'en-tête collant du site n'y a pas sa place (mission 16) :
 * tout ce qui est enveloppé ici disparaît sur cette page seulement. Client :
 * seule l'adresse (`usePathname`) le dit ; les enfants restent des composants
 * serveur.
 */
export default function HorsSimulateur({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  if (chemin === "/simulateur") return null;
  return <>{children}</>;
}
