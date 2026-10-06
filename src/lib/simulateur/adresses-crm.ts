/**
 * Les adresses du CRM que lisent les composants d'affichage (vignettes et échantillons du catalogue).
 *
 * Lot F7 : séparé de `generation-client.ts`. Le calque des matières du curseur avant / après (`CalqueMatieres`, envoyé
 * au navigateur sur toute page à curseur) n'a besoin que de `urlVignette` ; en l'important de `generation-client`, il
 * emportait le client de la génération (lancement, sondage, messages de l'analyse de la photo). Ce module n'importe
 * rien ; `generation-client.ts` le réexporte (les appels existants ne changent pas). L'adresse est lue à l'appel (dans
 * le navigateur, Next l'écrit en dur au build ; en test, elle suit l'environnement).
 */
export function baseCrm(): string {
  return (process.env.NEXT_PUBLIC_SIMULATE_URL ?? "").replace(/\/api\/simulate\/?$/, "");
}

/** Vignette de 320 px d'un échantillon (grille du catalogue), servie et mise en cache par le CRM. */
export function urlVignette(ref: string): string {
  return `${baseCrm()}/api/site/echantillons/${encodeURIComponent(ref)}?l=320`;
}

/** L'échantillon entier (« voir en grand »). */
export function urlEchantillon(ref: string): string {
  return `${baseCrm()}/api/site/echantillons/${encodeURIComponent(ref)}`;
}
