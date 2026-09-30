/**
 * Différer un appel (mission 16, partie 6 — INP) : chaque appel annule le précédent, seul le dernier part, `delai` ms
 * après le dernier. Sert la recherche de `/matieres` (150 ms, `DELAI_RECHERCHE_MS`) : le champ suit la frappe tout de
 * suite, le filtrage des 497 matières attend que la frappe s'arrête. `annuler` au démontage et pour « Effacer ».
 * Sans React, testable avec des minuteries simulées.
 */
export type AppelDiffere<T> = { appeler: (valeur: T) => void; annuler: () => void };

export function differer<T>(action: (valeur: T) => void, delai: number): AppelDiffere<T> {
  let minuteur: ReturnType<typeof setTimeout> | null = null;
  const annuler = () => {
    if (minuteur !== null) clearTimeout(minuteur);
    minuteur = null;
  };
  return {
    appeler: (valeur: T) => {
      annuler();
      minuteur = setTimeout(() => {
        minuteur = null;
        action(valeur);
      }, delai);
    },
    annuler,
  };
}
