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
};

const BASE_CRM = (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "");

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
