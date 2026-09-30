/**
 * Les tarifs publics du CRM (mission 16, partie 4) : `GET <CRM>/api/site/tarifs` — par famille, le prix unitaire de
 * chaque sous-partie (ou `null`, aucun tarif attribué : rien n'est inventé) et les formats de pièce (« Petite ≈ 3 m »…).
 * Lus côté serveur au plus une fois par heure ; si le CRM ne répond pas (erreur, silence, forme illisible) : `null`,
 * et l'estimation retombe sur les fourchettes d'`offre.ts` (`lib/estimation.ts`).
 */

export type IdFamilleTarifs = "CUISINE" | "SDB" | "MEUBLES" | "PRO";
export type UniteTarif = "ml" | "jour" | "forfait";
export type SousPartieTarif = { id: string; libelle: string; metrage: boolean; prixUnitaire: number | null; unite: UniteTarif };
export type FormatPiece = { id: string; libelle: string; aide: string; metres: number };
export type FamilleTarifs = { id: IdFamilleTarifs; sousParties: SousPartieTarif[]; formats: FormatPiece[] };
export type TarifsSite = { version: number; familles: FamilleTarifs[] };

const BASE_CRM = (process.env.NEXT_PUBLIC_CRM_URL || (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "")).replace(/\/$/, "");

/** Au-delà, le CRM est tenu pour injoignable : la page du simulateur ne l'attend pas. */
export const DELAI_TARIFS_MS = 5_000;

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";

/** La réponse a-t-elle la forme attendue ? (Un prix doit être un nombre positif ou `null`, une longueur un nombre positif.) */
export function tarifsLisibles(brut: unknown): brut is TarifsSite {
  if (!estObjet(brut) || !Array.isArray(brut.familles)) return false;
  return brut.familles.every(
    (f) =>
      estObjet(f) &&
      typeof f.id === "string" &&
      Array.isArray(f.sousParties) &&
      Array.isArray(f.formats) &&
      f.sousParties.every((s) => estObjet(s) && typeof s.id === "string" && typeof s.metrage === "boolean" && (s.prixUnitaire === null || (typeof s.prixUnitaire === "number" && Number.isFinite(s.prixUnitaire) && s.prixUnitaire > 0))) &&
      f.formats.every((x) => estObjet(x) && typeof x.id === "string" && typeof x.libelle === "string" && typeof x.metres === "number" && Number.isFinite(x.metres) && x.metres > 0)
  );
}

export async function chargerTarifs(options: { fetch?: typeof fetch; delaiMs?: number } = {}): Promise<TarifsSite | null> {
  const appel = options.fetch ?? fetch;
  try {
    const reponse = await appel(`${BASE_CRM}/api/site/tarifs`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(options.delaiMs ?? DELAI_TARIFS_MS) });
    if (!reponse.ok) return null;
    const donnees: unknown = await reponse.json();
    return tarifsLisibles(donnees) ? donnees : null;
  } catch (erreur) {
    console.error("[tarifs] CRM injoignable, estimation sur les fourchettes :", erreur instanceof Error ? erreur.message : erreur);
    return null;
  }
}
