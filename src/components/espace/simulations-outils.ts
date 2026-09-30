import type { SimulationClient } from "./api";

/**
 * Les petits outils de l'onglet Simulations (mission 15, partie 5 : extraits
 * d'EtapeSimulations, sans rien changer) : les noms que le client reconnaît,
 * l'origine d'une simulation, et la mémoire du téléphone (suivi, favoris).
 */
export const cleZone = (z: { zone: string; libelle: string }) => z.zone || z.libelle;
export const ORIGINE: Record<SimulationClient["source"], string> = { SITE: "Sur le site", CLIENT: "Par vous", CRM: "Par CoverSwap" };

/** Des noms que le client reconnaît : « Essai sur le site », « Votre simulation 2 », « Proposition 1 ». */
export function nommer(sims: SimulationClient[]): Map<string, string> {
  const rangs = { CLIENT: 0, CRM: 0, SITE: 0 };
  const noms = new Map<string, string>();
  const plusieursEssais = sims.filter((s) => s.source === "SITE").length > 1;
  for (const s of [...sims].sort((a, b) => a.le.localeCompare(b.le))) {
    if (s.source === "SITE") noms.set(s.id, plusieursEssais ? `Essai sur le site ${++rangs.SITE}` : "Essai sur le site");
    else if (s.source === "CLIENT") noms.set(s.id, `Votre simulation ${++rangs.CLIENT}`);
    else noms.set(s.id, `Proposition ${++rangs.CRM}`);
  }
  return noms;
}

export const cleSuivi = (jeton: string) => `espace-suivi:${jeton.split("-")[0]}`;
export const cleFavoris = (jeton: string) => `espace-favoris:${jeton.split("-")[0]}`;

export function lireLocal<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

export function ecrireLocal(cle: string, valeur: unknown): void {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // stockage indisponible
  }
}
