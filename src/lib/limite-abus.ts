/**
 * Limite d'abus, en mémoire, par clé (une adresse IP) et fenêtre glissante :
 * la seule garde qui reste côté site sur `/api/simulation/prepare` (mission 15,
 * partie 4). Le vrai quota (15 simulations par adresse et 150 par jour) est
 * tenu par le CRM, qui seul dépense ; ici on coupe seulement une rafale. Sur
 * Vercel chaque instance a son compteur : la limite est indicative.
 */
export const LIMITE_PREPARE = { max: 30, fenetreMs: 10 * 60 * 1000 };

const appelsParCle = new Map<string, number[]>();

/** Vrai si la clé a dépassé `max` appels dans la fenêtre ; enregistre l'appel sinon. Pur avec `maintenant` injecté. */
export function depasseLaLimite(cle: string, maintenant: number = Date.now(), limite: { max: number; fenetreMs: number } = LIMITE_PREPARE, compteurs: Map<string, number[]> = appelsParCle): boolean {
  const debut = maintenant - limite.fenetreMs;
  const appels = (compteurs.get(cle) ?? []).filter((t) => t > debut);
  if (appels.length >= limite.max) {
    compteurs.set(cle, appels);
    return true;
  }
  appels.push(maintenant);
  compteurs.set(cle, appels);
  if (compteurs.size > 5000) {
    for (const [k, valeurs] of compteurs) if (!valeurs.some((t) => t > debut)) compteurs.delete(k);
  }
  return false;
}
