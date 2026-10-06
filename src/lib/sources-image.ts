/*
 * Ce qu'il faut à `ImagePreparee` (composant rendu par le curseur `AvantApres`, donc envoyé au navigateur) pour écrire
 * un `<picture>` : le type des sources, les deux media et le plafond du téléphone.
 *
 * Lot F7 : séparé de `images-preparees.ts`, qui importe le manifeste des images (≈ 300 entrées) pour `sourcesPhoto`. Tant
 * qu'`ImagePreparee` lisait ces constantes là-bas, tout le manifeste partait dans le JavaScript du navigateur avec le
 * curseur. Ce module n'importe rien ; `images-preparees.ts` le réexporte (les appels existants ne changent pas).
 */
/**
 * Ce que `ImagePreparee` (`components/simulation`) sait rendre : une image du dépôt (`SourcesPhoto`, tout est connu) ou
 * une photo publiée par le CRM (`sourcesPhotoCrm` de `lib/publications` : WebP réduits en `srcset`, la photo telle
 * quelle en `src`, dimensions inconnues). Une source absente n'est pas écrite.
 */
export type SourcesImage = {
  avif?: string;
  webp?: string;
  /** `srcset` des JPEG. */
  jpg?: string;
  /** L'image du `src` (le repli). */
  src: string;
  largeur?: number;
  hauteur?: number;
};

/**
 * Mission 16 (partie 6, mesure Lighthouse) : sur un téléphone à forte densité (390 px × 3), le navigateur choisit
 * l'image de 1536 px alors que 960 px suffisent à l'œil ; le `<picture>` et le préchargement de l'ouverture
 * proposent donc au téléphone un `srcset` plafonné à 960 px (`MEDIA_TELEPHONE`), la pleine série ailleurs.
 */
export const MEDIA_TELEPHONE = "(max-width: 767px)";
export const MEDIA_ECRAN_LARGE = "(min-width: 768px)";
export const LARGEUR_MAX_TELEPHONE = 960;

/** Garde les candidats d'un `srcset` jusqu'à `max` px de large (au moins le plus petit, pour ne jamais rendre vide). */
export function plafonnerSrcset(srcset: string, max: number = LARGEUR_MAX_TELEPHONE): string {
  const entrees = srcset.split(",").map((e) => e.trim()).filter(Boolean);
  const gardees = entrees.filter((e) => {
    const m = /\s(\d+)w$/.exec(e);
    return !m || Number(m[1]) <= max;
  });
  return (gardees.length > 0 ? gardees : entrees.slice(0, 1)).join(", ");
}
