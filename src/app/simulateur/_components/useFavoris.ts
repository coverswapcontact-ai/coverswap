"use client";

import { useCallback, useState } from "react";

/** Les favoris du catalogue (références), gardés dans `localStorage` : ils survivent au parcours et à « Recommencer ». */
const CLE_FAVORIS = "coverswap-favoris";

const lireFavoris = (): string[] => {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_FAVORIS) ?? "[]");
    return Array.isArray(brut) ? brut.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
};

export function useFavoris() {
  const [favoris, setFavoris] = useState<string[]>([]);
  // Lus après le montage seulement (rendu côté serveur identique, aucune mémoire locale à ce moment-là).
  const charger = useCallback(() => setFavoris(lireFavoris()), []);
  const basculer = useCallback(
    (ref: string) =>
      setFavoris((f) => {
        const suivants = f.includes(ref) ? f.filter((x) => x !== ref) : [...f, ref];
        try {
          localStorage.setItem(CLE_FAVORIS, JSON.stringify(suivants));
        } catch {
          /* mémoire locale indisponible */
        }
        return suivants;
      }),
    []
  );
  return { favoris, charger, basculer };
}
