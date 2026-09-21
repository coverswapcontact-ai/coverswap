"use client";

import { usePathname } from "next/navigation";

/**
 * L'espace client (/e/<lien signé>) est une page privée : son adresse EST la clé
 * du dossier. Ni l'en-tête commercial, ni le bouton WhatsApp, ni surtout les
 * outils de mesure d'audience ne doivent s'y charger — ils enverraient cette
 * adresse à des tiers. Tout ce qui est enveloppé ici disparaît sur /e/.
 */
export default function HorsEspaceClient({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  if (chemin?.startsWith("/e/")) return null;
  return <>{children}</>;
}
