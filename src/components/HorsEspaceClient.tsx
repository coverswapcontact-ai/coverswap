"use client";

import { usePathname } from "next/navigation";

/**
 * L'espace client (/e/<lien signé>) est une page privée : son adresse EST la clé
 * du dossier. Ni l'en-tête commercial, ni le bouton WhatsApp, ni surtout les
 * outils de mesure d'audience ne doivent s'y charger — ils enverraient cette
 * adresse à des tiers. Tout ce qui est enveloppé ici disparaît sur /e/ (et sur
 * /desinscription, dont le lien porte l'adresse e-mail).
 */
export default function HorsEspaceClient({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  // La page de désinscription porte aussi une adresse e-mail dans son lien : même traitement.
  if (chemin?.startsWith("/e/") || chemin === "/desinscription") return null;
  return <>{children}</>;
}
