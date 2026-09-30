"use client";

import { usePathname } from "next/navigation";

/**
 * Mission 15 (partie 4) : le simulateur (/simulateur) est un parcours à part
 * entière, sur fond clair, avec son propre en-tête (retour à l'accueil) et un
 * bouton principal collé en bas. L'en-tête fixe du site et le bouton WhatsApp
 * flottant n'y ont pas leur place : tout ce qui est enveloppé ici disparaît
 * sur cette page seulement. (Le bandeau cookies, lui, reste monté mais discret
 * : « Gérer les cookies » du pied de page le rouvre.)
 */
export default function HorsSimulateur({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  if (chemin === "/simulateur") return null;
  return <>{children}</>;
}
