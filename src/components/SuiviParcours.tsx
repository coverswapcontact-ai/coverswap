"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { envoyerEvenement } from "@/lib/evenements-site";
import { memoriserOrigine } from "@/lib/utm";

/**
 * Mémorise l'origine de la visite (utm) à l'arrivée et signale chaque page vue
 * au CRM (audience par page et par source, sans donnée personnelle). Le
 * simulateur envoie lui-même sa page vue, avec le projet.
 */
export default function SuiviParcours() {
  const pathname = usePathname();
  useEffect(() => {
    memoriserOrigine();
    if (pathname !== "/simulateur") envoyerEvenement("PAGE_VUE");
  }, [pathname]);
  return null;
}
