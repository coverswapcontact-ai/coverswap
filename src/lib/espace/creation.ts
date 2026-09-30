/**
 * « Créer une simulation » dans l'espace client (mission 15, partie 5) — les
 * règles du parcours, PURES (sans DOM ni réseau, testées par creation.test.ts) :
 * les pièces et les zones telles que le CRM les donne (source unique : murs et
 * tablier de baignoire compris, limite de zones du CRM), les trois écrans
 * Pièce · Photo · Matières et leurs gestes (changer de pièce vide seulement les
 * matières ; reprendre la photo garde les matières), ce qui bloque le lancement,
 * les films pour l'écran d'attente, le texte du quota, et la lecture du suivi
 * d'une génération (prête, échec, relecture).
 */

import type { Creation, Piece, SuiviCreation, ZoneTeinte } from "@/components/espace/api";
import type { FilmChoisi } from "@/components/simulation/EcranAttente";
import { zoneNonVisible, type EtatAnalyse } from "@/lib/simulateur/reprise";

export type Teinte = { ref: string; nom: string };
export type ChoixCreation = { piece: string; photoId: string | null; teintes: Record<string, Teinte> };
export type EcranCreation = 1 | 2 | 3;

export const ECRANS_CREATION: readonly { numero: EcranCreation; libelle: string }[] = [
  { numero: 1, libelle: "Pièce" },
  { numero: 2, libelle: "Photo" },
  { numero: 3, libelle: "Matières" },
];

/** Limite de zones par simulation quand le CRM ne la donne pas (état gardé avant la partie 5). */
export const ZONES_MAX_PAR_DEFAUT = 4;

/** Le code d'une pièce de l'espace → la pièce du simulateur (dessin de la carte), pour un état d'avant la partie 5. */
const ID_PAR_CODE: Record<string, string> = { CUISINE: "cuisine", SDB: "salle-de-bain", MEUBLES: "meubles", MURS: "mur-plafond", PRO: "professionnel" };

export const idDePiece = (piece: Pick<Piece, "piece" | "id">): string => piece.id ?? ID_PAR_CODE[piece.piece] ?? piece.piece.toLowerCase();

/** Les pièces proposées : celles du CRM (son projet d'abord) ; un CRM d'avant n'en donnait qu'une. */
export function piecesDeCreation(creation: Pick<Creation, "pieces" | "piece" | "zones"> | null | undefined): Piece[] {
  if (creation?.pieces?.length) return creation.pieces;
  return [{ piece: creation?.piece ?? "CUISINE", libelle: "Votre projet", aide: "", zones: creation?.zones ?? [] }];
}

export const zonesMaxDe = (creation: Pick<Creation, "zonesMax"> | null | undefined): number => creation?.zonesMax ?? ZONES_MAX_PAR_DEFAUT;

/** Les zones d'une pièce, celles cochées dans son Projet d'abord (le CRM les ordonne déjà ; un état d'avant ne le faisait pas). */
export function zonesOrdonnees(piece: Piece): Piece["zones"] {
  const cochees = new Set(piece.cochees ?? []);
  return [...piece.zones].sort((a, b) => Number(cochees.has(b.zone)) - Number(cochees.has(a.zone)));
}

/** La pièce qui porte ces zones (une simulation à refaire « avec d'autres matières »), sinon la première. */
export function pieceDesZones(pieces: Piece[], zones: Pick<ZoneTeinte, "zone">[]): Piece {
  return pieces.find((p) => zones.length > 0 && zones.every((z) => p.zones.some((pz) => pz.zone === z.zone))) ?? pieces.find((p) => zones.some((z) => p.zones.some((pz) => pz.zone === z.zone))) ?? pieces[0];
}

/** Repartir d'une simulation : sa pièce et ses teintes, la photo à choisir de nouveau. */
export function choixDepuisSimulation(pieces: Piece[], zones: ZoneTeinte[]): ChoixCreation {
  const piece = pieceDesZones(pieces, zones);
  const teintes: Record<string, Teinte> = {};
  for (const z of zones) if (piece.zones.some((pz) => pz.zone === z.zone) && z.ref) teintes[z.zone] = { ref: z.ref, nom: z.nom || z.ref };
  return { piece: piece.piece, photoId: null, teintes };
}

/* ── Les trois écrans ─────────────────────────────────────────────── */

export type Progression = { pieceChoisie: boolean; photoId: string | null; generationEnCours?: boolean };

export function ecranMaxCreation(p: Progression): EcranCreation {
  if (p.photoId) return 3;
  if (p.pieceChoisie) return 2;
  return 1;
}

/** Toujours en arrière ; en avant jusqu'à ce qui est fait ; pendant le lancement, rien ne bouge. */
export function ecranAtteignableCreation(p: Progression, cible: EcranCreation, courant: EcranCreation): boolean {
  if (p.generationEnCours) return cible === courant;
  if (cible <= courant) return true;
  return cible <= ecranMaxCreation(p);
}

export type GesteCreation =
  | { type: "piece-choisie"; piece: string }
  | { type: "photo-choisie"; photoId: string }
  | { type: "photo-reprise" }
  | { type: "teinte-choisie"; zone: string; teinte: Teinte; aussi?: string[] }
  | { type: "teinte-retiree"; zone: string }
  | { type: "tout-recommencer" }
  | { type: "retour"; vers: EcranCreation };

export type TransitionCreation = { choix: ChoixCreation; ecran: EcranCreation };

/** Le choix et l'écran après un geste. Changer de pièce vide SEULEMENT les matières ; reprendre la photo les garde. */
export function reduireCreation(courant: EcranCreation, choix: ChoixCreation, geste: GesteCreation, options: { pieceChoisie?: boolean; generationEnCours?: boolean } = {}): TransitionCreation {
  switch (geste.type) {
    case "piece-choisie":
      return { choix: geste.piece === choix.piece ? choix : { ...choix, piece: geste.piece, teintes: {} }, ecran: 2 };
    case "photo-choisie":
      return { choix: { ...choix, photoId: geste.photoId }, ecran: 3 };
    case "photo-reprise":
      return { choix, ecran: 2 };
    case "teinte-choisie": {
      const teintes = { ...choix.teintes, [geste.zone]: geste.teinte };
      for (const zone of geste.aussi ?? []) teintes[zone] = geste.teinte;
      return { choix: { ...choix, teintes }, ecran: 3 };
    }
    case "teinte-retiree": {
      const teintes = { ...choix.teintes };
      delete teintes[geste.zone];
      return { choix: { ...choix, teintes }, ecran: courant };
    }
    case "tout-recommencer":
      return { choix: { piece: choix.piece, photoId: null, teintes: {} }, ecran: 1 };
    case "retour": {
      const p: Progression = { pieceChoisie: options.pieceChoisie ?? true, photoId: choix.photoId, generationEnCours: options.generationEnCours };
      return { choix, ecran: ecranAtteignableCreation(p, geste.vers, courant) ? geste.vers : courant };
    }
  }
}

/** L'écran de départ d'un choix repris (après un échec) : le plus loin possible. */
export function ecranDeDepart(choix: ChoixCreation, pieceChoisie: boolean): EcranCreation {
  return ecranMaxCreation({ pieceChoisie, photoId: choix.photoId });
}

/* ── Lancement ────────────────────────────────────────────────────── */

/** Les zones de la pièce qui ont une teinte, dans l'ordre de la pièce. */
export function zonesChoisies(piece: Piece, choix: ChoixCreation): { zone: string; libelle: string; teinte: Teinte }[] {
  return zonesOrdonnees(piece).flatMap((z) => (choix.teintes[z.zone] ? [{ zone: z.zone, libelle: z.libelle, teinte: choix.teintes[z.zone] }] : []));
}

/**
 * Pourquoi le bouton « Lancer ma simulation » attend encore (null : on peut lancer) : la photo, une matière,
 * une zone que l'analyse de la photo ne voit pas (une teinte reprise après un échec ou d'une autre simulation
 * peut porter sur une zone absente de la nouvelle photo — le CRM la refuserait en 409), la limite du CRM.
 */
export function raisonBloque(piece: Piece, choix: ChoixCreation, zonesMax: number, analyse: EtatAnalyse | null = null): string | null {
  if (!choix.photoId) return "Choisissez d'abord la photo sur laquelle faire la simulation.";
  const choisies = zonesChoisies(piece, choix);
  if (choisies.length === 0) return "Choisissez au moins une matière.";
  const nonVisibles = choisies.filter((z) => zoneNonVisible(analyse, [z.zone]));
  if (nonVisibles.length > 0) {
    const plusieurs = nonVisibles.length > 1;
    return `${plusieurs ? "Ces zones ne sont pas visibles" : "Cette zone n'est pas visible"} sur votre photo : ${nonVisibles.map((z) => z.libelle).join(", ")}. Retirez-${plusieurs ? "les" : "la"}, ou reprenez une photo.`;
  }
  if (choisies.length > zonesMax) return `${zonesMax} zones au plus par simulation : retirez-en une, vous pourrez en refaire une autre ensuite.`;
  return null;
}

/** Ce que l'écran d'attente montre sous la photo : chaque zone et son film. */
export function filmsChoisis(zones: { zone: string; libelle: string; ref: string; nom: string }[], urlVignette: (ref: string) => string): FilmChoisi[] {
  return zones.map((z) => ({ zone: z.zone, libelle: z.libelle || z.zone, nom: z.nom || z.ref, image: z.ref ? urlVignette(z.ref) : null }));
}

/** « Il vous en reste 3 sur 5 » ; la dernière est dite ; à zéro : « Vous avez utilisé vos 5 simulations ». */
export function texteQuota(restantes: number, total: number): string {
  if (restantes <= 0) return total > 1 ? `Vous avez utilisé vos ${total} simulations.` : "Vous avez utilisé votre simulation.";
  if (restantes === 1) return total > 1 ? `Il vous en reste 1 sur ${total} : c'est la dernière.` : "Une simulation offerte.";
  return `Il vous en reste ${restantes} sur ${total}.`;
}

/* ── Le suivi d'une génération ────────────────────────────────────── */

export const INTERVALLE_SUIVI_MS = 3_000;

/** Le statut de l'écran d'attente : en file tant que le CRM n'a pas posé d'étape. */
export function statutAttente(suivi: Pick<SuiviCreation, "etape"> | null): "EN_ATTENTE" | "EN_COURS" {
  return suivi?.etape ? "EN_COURS" : "EN_ATTENTE";
}

export type EvenementSuivi = { type: "reponse"; reponse: SuiviCreation } | { type: "http"; status: number } | { type: "reseau" };
export type DecisionSuivi =
  | { suite: "continuer"; etape: string | null; attenteEstimeeS: number | null; horsLigne: boolean }
  | { suite: "prete"; simulationId: string | null }
  | { suite: "relecture"; simulationId: string | null; message: string }
  | { suite: "echec"; raison: string; message: string }
  | { suite: "oubliee" };

export const MESSAGE_ECHEC_CREATION = "Cette simulation n'a pas abouti. Elle ne compte pas : vous pouvez la relancer.";
export const MESSAGE_RELECTURE = "Votre simulation demande une relecture : vous la recevrez dès qu'elle est prête.";

/**
 * Ce que l'écran fait d'une réponse du suivi : continuer (avec l'étape), la
 * montrer, dire l'échec, dire la relecture, ou l'oublier (404 : elle n'existe
 * plus pour cet espace). Une panne passagère (réseau, 5xx, 429) : on continue,
 * hors ligne — la génération continue de son côté.
 */
export function reduireSuivi(evenement: EvenementSuivi): DecisionSuivi {
  if (evenement.type === "reseau") return { suite: "continuer", etape: null, attenteEstimeeS: null, horsLigne: true };
  if (evenement.type === "http") {
    if (evenement.status === 404) return { suite: "oubliee" };
    if (evenement.status >= 500 || evenement.status === 429 || evenement.status === 0) return { suite: "continuer", etape: null, attenteEstimeeS: null, horsLigne: true };
    return { suite: "echec", raison: "echec", message: MESSAGE_ECHEC_CREATION };
  }
  const r = evenement.reponse;
  switch (r.statut) {
    case "PRETE":
      return { suite: "prete", simulationId: r.simulationId };
    case "RELECTURE":
      return { suite: "relecture", simulationId: r.simulationId, message: r.message ?? MESSAGE_RELECTURE };
    case "ECHEC":
      return { suite: "echec", raison: r.raison ?? "echec", message: r.message ?? MESSAGE_ECHEC_CREATION };
    default:
      return { suite: "continuer", etape: r.etape ?? null, attenteEstimeeS: typeof r.attenteEstimeeS === "number" ? r.attenteEstimeeS : null, horsLigne: false };
  }
}
