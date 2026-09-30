"use client";

import { usePathname } from "next/navigation";

/**
 * L'espace client (/e/<lien signé>) est une page privée : son adresse EST la clé
 * du dossier. Ni l'en-tête commercial, ni surtout le suivi de parcours ne
 * doivent s'y charger — il enverrait cette adresse au CRM. Tout ce qui est
 * enveloppé ici disparaît sur /e/ (et sur /desinscription, dont le lien porte
 * l'adresse e-mail). Client : seule l'adresse (`usePathname`) le dit ; les
 * enfants restent des composants serveur.
 */
export default function HorsEspaceClient({ children }: { children: React.ReactNode }) {
  const chemin = usePathname();
  // La page de désinscription porte aussi une adresse e-mail dans son lien : même traitement.
  if (chemin?.startsWith("/e/") || chemin === "/desinscription") return null;
  return <>{children}</>;
}
