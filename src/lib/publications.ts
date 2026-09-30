import type { SourcesImage } from "@/lib/images-preparees";

/**
 * Réalisations et avis publiés depuis le CRM (écran « Site »), lus par le site
 * toutes les cinq minutes. Rien n'est écrit ici : la porte est ouverte, le CRM
 * décide ce qui paraît, avec l'accord de la personne.
 */
export type Publication = {
  id: string;
  type: "REALISATION" | "AVIS";
  titre: string;
  texte: string | null;
  ville: string | null;
  typeProjet: string | null;
  note: number | null;
  auteur: string | null;
  photoAvant: string | null;
  photoApres: string | null;
  publieLe: string;
  /**
   * Mission 16 (partie 3) : lus s'ils arrivent, jamais inventés — le CRM ne les publie pas encore (`PublicationSite`
   * n'a ni matières, ni prix, ni durée). Une carte d'étude de cas montre le prix et la durée publiés ; à défaut, la
   * fourchette et la durée habituelles d'`offre.ts`, libellées comme telles (`lib/etude-de-cas`).
   */
  matieres?: { ref: string; nom: string }[] | null;
  prix?: number | null;
  duree?: string | null;
};

const BASE_CRM = (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "");

/**
 * Largeurs demandées au CRM pour une photo publiée (`/api/site/photos/<id>/<avant|apres>?l=<largeur>` : WebP réduit
 * par le CRM, jamais agrandi ; mission 16, partie 3). Sans `l`, la photo telle quelle (1 600 px de côté au plus).
 */
export const LARGEURS_PHOTO_CRM = [480, 960, 1600] as const;

/**
 * Les sources d'une photo publiée par le CRM pour `ImagePreparee` : les WebP réduits en `srcset` (le navigateur prend
 * la largeur utile, au lieu de la photo entière), la photo telle quelle en repli. Ses dimensions ne sont pas connues :
 * le cadre de l'image réserve la place (`aspect-ratio`). Un CRM qui ne connaît pas `l` renvoie la photo entière : rien
 * ne casse.
 */
export function sourcesPhotoCrm(url: string): SourcesImage {
  const reduite = (largeur: number) => `${url}${url.includes("?") ? "&" : "?"}l=${largeur}`;
  return { webp: LARGEURS_PHOTO_CRM.map((l) => `${reduite(l)} ${l}w`).join(", "), src: url };
}

const LIBELLES_PROJET: Record<string, string> = { CUISINE: "Cuisine", SDB: "Salle de bain", MEUBLES: "Meubles", PRO: "Professionnel", AUTRE: "Autre" };

export function libelleProjet(code: string | null): string | null {
  return code ? (LIBELLES_PROJET[code] ?? code) : null;
}

export async function chargerPublications(): Promise<{ realisations: Publication[]; avis: Publication[] }> {
  try {
    const res = await fetch(`${BASE_CRM}/api/site/publications`, { next: { revalidate: 300 } });
    if (!res.ok) return { realisations: [], avis: [] };
    const data = (await res.json()) as { publications?: Publication[] };
    const toutes = (data.publications ?? []).map((p) => ({
      ...p,
      photoAvant: p.photoAvant ? `${BASE_CRM}${p.photoAvant}` : null,
      photoApres: p.photoApres ? `${BASE_CRM}${p.photoApres}` : null,
    }));
    return { realisations: toutes.filter((p) => p.type === "REALISATION"), avis: toutes.filter((p) => p.type === "AVIS") };
  } catch (err) {
    console.error("[publications] CRM injoignable :", err);
    return { realisations: [], avis: [] };
  }
}
