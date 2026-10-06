/**
 * Les pièces et les zones du simulateur, LUES DANS LE CRM (mission 15, partie 4)
 * : `GET <CRM>/api/site/simulateur`, source unique `crm/src/lib/simulateur/zones.ts`.
 * Le site n'a plus de liste à lui : libellés, descriptions, incompatibilités,
 * limite de zones viennent de là (mise en cache une heure). Si le CRM ne répond
 * pas, une copie figée (`ZONES_REPLI`, la même liste au 30/09/2026) garde la
 * page debout. Fonctions pures pour l'écran et pour `prepare`.
 */

import { pictoDeLaPiece } from "./projets";

export type ZoneSimulateur = { id: string; libelle: string; description: string; exclut: string[]; compose: string[] };
export type PieceSimulateur = { id: string; libelle: string; titre: string; code: string; zones: ZoneSimulateur[] };
export type ZonesSimulateur = { version: number; zonesMax: number; pieces: PieceSimulateur[] };

export const ZONES_REPLI: ZonesSimulateur = {
  version: 1,
  zonesMax: 4,
  pieces: [
    {
      id: "cuisine",
      libelle: "Cuisine",
      titre: "Votre cuisine",
      code: "CUISINE",
      zones: [
        { id: "facades-cuisine", libelle: "Façades (toutes)", description: "Toutes les portes et tous les tiroirs : meubles hauts, bas, colonnes, îlot", exclut: ["meubles-hauts", "meubles-bas"], compose: ["meubles-hauts", "meubles-bas"] },
        { id: "meubles-hauts", libelle: "Meubles hauts", description: "Les portes des meubles suspendus au-dessus du plan de travail", exclut: ["facades-cuisine"], compose: [] },
        { id: "meubles-bas", libelle: "Meubles bas", description: "Portes et tiroirs sous le plan de travail, colonnes, îlot", exclut: ["facades-cuisine"], compose: [] },
        { id: "plan-de-travail", libelle: "Plan de travail", description: "La surface horizontale de travail et son chant", exclut: [], compose: [] },
        { id: "credence", libelle: "Crédence", description: "Le mur entre le plan de travail et les meubles hauts", exclut: [], compose: [] },
      ],
    },
    {
      id: "salle-de-bain",
      libelle: "Salle de bain",
      titre: "Votre salle de bain",
      code: "SDB",
      zones: [
        { id: "meuble-vasque", libelle: "Meuble vasque", description: "Les façades et les côtés du meuble sous le lavabo", exclut: [], compose: [] },
        { id: "plan-vasque", libelle: "Plan vasque", description: "Le dessus du meuble, autour du lavabo", exclut: [], compose: [] },
        { id: "carrelage-mural", libelle: "Murs carrelés", description: "Les murs carrelés de la salle de bain", exclut: [], compose: [] },
        { id: "tablier-baignoire", libelle: "Tablier de baignoire", description: "Le panneau sous la baignoire ou l'habillage du receveur", exclut: [], compose: [] },
      ],
    },
    {
      id: "meubles",
      libelle: "Meubles",
      titre: "Vos meubles",
      code: "MEUBLES",
      zones: [
        { id: "portes-dressing", libelle: "Portes du dressing", description: "Portes battantes ou coulissantes, du sol au plafond", exclut: [], compose: [] },
        { id: "meuble-tv", libelle: "Meuble TV", description: "Façades, dessus et côtés du meuble TV", exclut: [], compose: [] },
        { id: "meuble-complet", libelle: "Commode, buffet, bureau", description: "Un meuble seul : façades, dessus et côtés", exclut: [], compose: [] },
      ],
    },
    {
      id: "mur-plafond",
      libelle: "Murs, plafond",
      titre: "Vos murs",
      code: "MURS",
      zones: [
        { id: "mur-principal", libelle: "Mur principal", description: "Le mur le plus large ou le plus visible", exclut: [], compose: [] },
        { id: "mur-accent", libelle: "Second mur", description: "Un autre mur ou un pan décoratif (niche, tête de lit, retour)", exclut: [], compose: [] },
        { id: "plafond", libelle: "Plafond", description: "La surface du plafond", exclut: [], compose: [] },
      ],
    },
    {
      id: "professionnel",
      libelle: "Local professionnel",
      titre: "Votre espace pro",
      code: "PRO",
      zones: [
        { id: "comptoir-habillage", libelle: "Façade du bar", description: "La face avant et les côtés du bar ou du comptoir d'accueil", exclut: [], compose: [] },
        { id: "comptoir-plateau", libelle: "Plateau du bar", description: "Le dessus du bar, du comptoir ou du bureau d'accueil", exclut: [], compose: [] },
        { id: "mobilier-pro", libelle: "Mobilier", description: "Carrosserie d'un distributeur, borne, présentoir, casiers, mobilier d'agencement", exclut: [], compose: [] },
        { id: "rangements-pro", libelle: "Rangements", description: "Portes de placards, armoires et meubles bas du local", exclut: [], compose: [] },
        { id: "habillage-mural", libelle: "Habillage mural", description: "Un mur ou un panneau décoratif du local", exclut: [], compose: [] },
      ],
    },
  ],
};

const BASE_CRM = (process.env.NEXT_PUBLIC_CRM_URL || (process.env.NEXT_PUBLIC_SIMULATE_URL || "https://crm.coverswap.fr/api/simulate").replace(/\/api\/simulate\/?$/, "")).replace(/\/$/, "");

function lisible(brut: unknown): brut is ZonesSimulateur {
  const z = brut as ZonesSimulateur;
  return !!z && typeof z === "object" && Array.isArray(z.pieces) && z.pieces.length >= 3 && typeof z.zonesMax === "number" && z.pieces.every((p) => typeof p.id === "string" && Array.isArray(p.zones) && p.zones.length > 0);
}

/** Au-delà, le CRM est tenu pour injoignable et la copie figée sert : `prepare` (15 s au plus sur Vercel) ne doit jamais attendre la coupure. */
export const DELAI_ZONES_MS = 5_000;

/**
 * Côté serveur (page et `prepare`) : la liste du CRM, une heure en cache ; le
 * repli si le CRM ne répond pas — en erreur OU en silence (délai).
 */
export async function chargerZonesSimulateur(options: { delaiMs?: number; fetch?: typeof fetch } = {}): Promise<ZonesSimulateur> {
  const appel = options.fetch ?? fetch;
  try {
    const reponse = await appel(`${BASE_CRM}/api/site/simulateur`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(options.delaiMs ?? DELAI_ZONES_MS) });
    if (!reponse.ok) return ZONES_REPLI;
    const donnees: unknown = await reponse.json();
    return lisible(donnees) ? donnees : ZONES_REPLI;
  } catch (erreur) {
    console.error("[simulateur] zones du CRM injoignables, repli :", erreur instanceof Error ? erreur.message : erreur);
    return ZONES_REPLI;
  }
}

/** « quatre » pour 4 : la limite de zones en lettres dans les textes de la page (le nombre vient du CRM). */
export function zonesMaxEnLettres(n: number): string {
  const lettres = ["", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
  return lettres[n] ?? String(n);
}

/* ── Fonctions pures ──────────────────────────────────────────────── */

/**
 * Site 3.0, lot E2 : le picto d'une zone, à l'écran des matières. Seules les zones qu'un picto de la série 1 ou 2
 * montre mieux que celui de leur pièce sont nommées ici ; les autres, et toute zone nouvelle publiée par le CRM,
 * prennent le picto de la pièce (`pictoDeZone`).
 */
export const PICTO_DE_ZONE: Partial<Record<string, string>> = {
  "plan-de-travail": "picto-plan-de-travail",
  "meuble-vasque": "picto-meuble-vasque",
  "carrelage-mural": "picto-murs",
  "portes-dressing": "picto-placard-coulissant",
  "meuble-complet": "picto-commode",
  "mobilier-pro": "picto-mobilier",
  "rangements-pro": "picto-placard-coulissant",
  "habillage-mural": "picto-murs",
};

export function pictoDeZone(zoneId: string, pieceId: string): string {
  return PICTO_DE_ZONE[zoneId] ?? pictoDeLaPiece(pieceId);
}

export function pieceDe(zones: ZonesSimulateur, projetId: string): PieceSimulateur {
  return zones.pieces.find((p) => p.id === projetId) ?? zones.pieces[0];
}

export function zoneDe(piece: PieceSimulateur, zoneId: string): ZoneSimulateur | null {
  return piece.zones.find((z) => z.id === zoneId) ?? null;
}

/** « Votre cuisine », « Vos meubles », « Votre espace pro » : le titre de l'écran résultat, tel que le CRM le dit. */
export function titrePiece(zones: ZonesSimulateur, projetId: string): string {
  return pieceDe(zones, projetId).titre;
}

/**
 * Les zones élémentaires que couvre un choix : une zone composée
 * (« Façades (toutes) ») vaut ses composantes pour l'analyse de la photo.
 */
export function composantesDe(piece: PieceSimulateur, zoneId: string): string[] {
  const zone = zoneDe(piece, zoneId);
  return zone && zone.compose.length > 0 ? zone.compose : [zoneId];
}
