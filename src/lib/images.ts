/**
 * Photos de fond servies en fichiers locaux déjà dimensionnés (voir
 * scripts/importer-fonds.mjs) : `/images/fonds/<id>` désigne la paire
 * `<id>-800.jpg` (mobile) et `<id>-1600.jpg` (écrans larges).
 *
 * Le site n'utilise pas l'optimiseur d'images de Vercel (quota du plan Hobby
 * épuisé → 402) : `images.unoptimized` est activé dans next.config.ts, et le
 * choix de la taille se fait ici, par srcset.
 */
export const LARGEURS_FOND = [800, 1600] as const;

export function fondSrc(base: string, largeur: (typeof LARGEURS_FOND)[number] = 1600): string {
  return `${base}-${largeur}.jpg`;
}

export function fondSrcSet(base: string): string {
  return LARGEURS_FOND.map((l) => `${fondSrc(base, l)} ${l}w`).join(", ");
}
