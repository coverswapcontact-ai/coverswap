/**
 * Les prestations de CoverSwap, lues dans le CRM (source unique :
 * crm-coverswap/src/lib/prestations/prestations.ts, servie par
 * `GET <CRM>/api/site/prestations`) : les quatre familles, leurs sous-parties.
 * Le site les montre dans le formulaire de devis et sur les cartes du
 * simulateur. Lues au plus une fois par heure ; si le CRM ne répond pas, un
 * repli minimal (les quatre noms) garde les pages debout.
 */
export type FamillePrestation = {
  id: "CUISINE" | "SDB" | "MEUBLES" | "PRO";
  libelle: string;
  aide: string;
  projetSimulateur: string;
  sousParties: { id: string; libelle: string; aide: string }[];
};

const BASE_CRM = (process.env.NEXT_PUBLIC_CRM_URL || (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "")).replace(/\/$/, "");

/** Repli si le CRM ne répond pas (mêmes noms que le fichier du CRM ; les sous-parties viennent de lui seul). */
export const FAMILLES_REPLI: FamillePrestation[] = [
  { id: "CUISINE", libelle: "Cuisine", aide: "Façades, plan de travail, crédence, îlot", projetSimulateur: "cuisine", sousParties: [] },
  { id: "SDB", libelle: "Salle de bain", aide: "Meuble vasque, plan vasque, crédence, placards", projetSimulateur: "salle-de-bain", sousParties: [] },
  { id: "MEUBLES", libelle: "Mobilier", aide: "Dressing, placards, meuble TV, bar, bibliothèque, bureau", projetSimulateur: "meubles", sousParties: [] },
  { id: "PRO", libelle: "Professionnel", aide: "Comptoir, mobilier d'accueil, distributeur, agencement", projetSimulateur: "professionnel", sousParties: [] },
];

export async function chargerPrestations(): Promise<FamillePrestation[]> {
  try {
    const reponse = await fetch(`${BASE_CRM}/api/site/prestations`, { next: { revalidate: 3600 } });
    if (!reponse.ok) return FAMILLES_REPLI;
    const donnees = (await reponse.json()) as { familles?: FamillePrestation[] };
    return Array.isArray(donnees.familles) && donnees.familles.length ? donnees.familles : FAMILLES_REPLI;
  } catch (erreur) {
    console.error("[prestations] CRM injoignable, repli :", erreur);
    return FAMILLES_REPLI;
  }
}

/** Nom et description des projets du simulateur qui sont des familles (les autres gardent les leurs). */
export function libellesDuSimulateur(familles: FamillePrestation[]): Record<string, { label: string; description: string }> {
  return Object.fromEntries(familles.map((f) => [f.projetSimulateur, { label: f.libelle, description: f.aide }]));
}
