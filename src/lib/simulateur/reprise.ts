/**
 * Simulateur : la mémoire du parcours et sa reprise (mission 15, partie 1).
 * Fonctions PURES, sans DOM ni réseau — testées par reprise.test.ts :
 *  - l'état v2 et la conversion de l'ancien état v1 ;
 *  - la décision au montage de /simulateur (reprendre le sondage, montrer le
 *    résultat, proposer « Reprendre ma simulation ») ;
 *  - la machine d'état du sondage (une réponse ou une panne → continuer, prêt,
 *    échec) ;
 *  - les cases cochées d'après l'étape du travail, l'attente en mots.
 */

export type Selection = { ref: string; nom: string; famille: string; finition: string; categorie: string; tags: string[]; image: string };
export type ReferenceRendu = { zone: string; libelle: string; ref: string; nom: string };

/** Un rendu du parcours : des adresses (servies par le CRM), plus jamais des images en base64. */
export type RenduSimulateur = {
  travailId: string;
  simulationSiteId: string | null;
  urlApres: string;
  urlAvant: string | null;
  references: ReferenceRendu[];
  /** Horodatage (ms) de l'arrivée du rendu. */
  le: number;
};

export type TravailEnCours = { travailId: string; lanceLe: number; attenteEstimeeS: number };

/**
 * L'attente annoncée quand le CRM ne donne pas d'estimation : la même que la
 * promesse du site (`lib/offre.ts › DELAI_RENDU`, « environ 1 min 30 ») — les
 * deux vont ensemble.
 */
export const ATTENTE_PAR_DEFAUT_S = 90;

/** Verdict de qualité de la photo, tel que le CRM le rend (mission 15, partie 2). */
export type VerdictPhoto = "bonne" | "floue" | "sombre" | "contre-jour" | "trop-loin";

/**
 * L'analyse de la photo (mission 15, partie 4), gardée avec elle : les zones
 * que le CRM voit et ne voit pas (pour griser), le conseil de qualité, et un
 * code de raison quand elle a été sautée (le site ne lit jamais le détail).
 */
export type EtatAnalyse = {
  empreinte: string;
  statut: "EN_COURS" | "PRETE" | "SAUTEE" | "ECHEC";
  zonesVisibles: string[];
  zonesNonVisibles: string[];
  verdict: VerdictPhoto | null;
  conseil: string | null;
  raison: string | null;
};

export type EtatSimulateur = {
  projet: string;
  /** La photo réduite (data URL), la seule image gardée ici. */
  photo: string | null;
  /** Ses dimensions (px), connues à la préparation : l'écran réserve le rapport avant que l'image ne soit décodée (rien ne saute). */
  photoLargeur: number | null;
  photoHauteur: number | null;
  selections: Record<string, Selection | null>;
  /**
   * Copié depuis le sessionStorage : il survit à la fermeture de l'onglet, mais 7 jours au plus après sa naissance
   * (`parcoursNeLe`, `DUREE_PARCOURS_MS`) — ce n'est pas un identifiant persistant.
   */
  parcoursId: string | null;
  /** Mission 17 (partie B) : naissance du parcours (ms), jamais repoussée ; au-delà de 7 jours, la mémoire repart de zéro. */
  parcoursNeLe: number;
  travailEnCours: TravailEnCours | null;
  /** Historique du parcours, le plus récent en fin de liste. */
  rendus: RenduSimulateur[];
  /** L'analyse de la photo courante (partie 4) ; null tant qu'elle n'est pas demandée. */
  analyse: EtatAnalyse | null;
  /** Mission 16 (partie 4) : ville et code postal déjà donnés dans ce parcours — le formulaire ne les redemande pas. */
  ville: string | null;
  codePostal: string | null;
  /** Mission 16 (partie 4) : la matière demandée par l'adresse (`?ref=`, depuis /matieres), posée à l'écran des matières. */
  refDemandee: string | null;
  majLe: number;
};

export const ETAT_VIDE: EtatSimulateur = { projet: "cuisine", photo: null, photoLargeur: null, photoHauteur: null, selections: {}, parcoursId: null, parcoursNeLe: 0, travailEnCours: null, rendus: [], analyse: null, ville: null, codePostal: null, refDemandee: null, majLe: 0 };

/** Le rapport CSS (`aspect-ratio`) de la photo, quand ses dimensions sont connues. */
export function rapportPhoto(etat: Pick<EtatSimulateur, "photoLargeur" | "photoHauteur">): string | null {
  return etat.photoLargeur && etat.photoHauteur && etat.photoLargeur > 0 && etat.photoHauteur > 0 ? `${etat.photoLargeur} / ${etat.photoHauteur}` : null;
}

/**
 * Mission 17 (partie B) : la durée de vie d'un parcours du simulateur sur l'appareil, comptée depuis sa naissance,
 * JAMAIS prolongée par l'usage.
 *
 * Pourquoi un identifiant survit à l'onglet : c'est le service que la personne demande — retrouver sa photo, ses
 * choix et ses rendus après un rechargement, une page quittée pendant la génération, ou le lien du mail « simulation
 * prête » ; le CRM sert les rendus et suit le travail par ce parcours (`?p=`). Pourquoi 7 jours : assez pour
 * reprendre une simulation en cours ou y revenir dans la semaine, trop court pour servir d'identifiant de mesure.
 * La mesure d'audience n'en a plus besoin (le CRM compte un visiteur du jour, sans rien garder sur l'appareil).
 * Au-delà : la mémoire entière est effacée (photo, choix, rendus, identifiant — les rendus et l'analyse sont liés
 * au parcours côté CRM, les garder sous un parcours neuf casserait leurs adresses) et un nouveau parcours commence.
 */
export const DUREE_PARCOURS_MS = 7 * 24 * 60 * 60 * 1000;

/** Au-delà, un parcours n'est plus proposé à la reprise : la durée de vie du parcours (le CRM garde les rendus 30 jours). */
export const REPRISE_MAX_MS = DUREE_PARCOURS_MS;

/**
 * Pure : la mémoire lue d'IndexedDB, ou null si son parcours a expiré (plus de 7 jours depuis sa naissance, ou une
 * naissance dans le futur : horloge changée). Sans naissance connue (mémoire d'avant la mission 17), la dernière
 * mise à jour en tient lieu.
 */
export function memoireDuParcours(etat: EtatSimulateur | null, maintenant: number = Date.now()): EtatSimulateur | null {
  if (!etat) return null;
  const age = maintenant - (etat.parcoursNeLe || etat.majLe);
  return age >= 0 && age <= DUREE_PARCOURS_MS ? etat : null;
}

/** Pure : la naissance du parcours retenu au montage — celle de la mémoire si c'est le même parcours, sinon maintenant. */
export function naissanceDuParcours(memoire: Pick<EtatSimulateur, "parcoursId" | "parcoursNeLe" | "majLe"> | null, parcoursId: string, maintenant: number = Date.now()): number {
  if (memoire && memoire.parcoursId === parcoursId) return memoire.parcoursNeLe || memoire.majLe || maintenant;
  return maintenant;
}

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const texteOuNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const entierPositifOuNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null);

function lireReferences(v: unknown): ReferenceRendu[] {
  return Array.isArray(v) ? v.filter(estObjet).map((r) => ({ zone: String(r.zone ?? ""), libelle: String(r.libelle ?? ""), ref: String(r.ref ?? ""), nom: String(r.nom ?? "") })) : [];
}

const listeDeTextes = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function lireAnalyse(v: unknown): EtatAnalyse | null {
  if (!estObjet(v) || typeof v.empreinte !== "string" || typeof v.statut !== "string") return null;
  const statut = ["EN_COURS", "PRETE", "SAUTEE", "ECHEC"].includes(v.statut) ? (v.statut as EtatAnalyse["statut"]) : "ECHEC";
  const verdict = typeof v.verdict === "string" && VERDICTS.includes(v.verdict as VerdictPhoto) ? (v.verdict as VerdictPhoto) : null;
  return { empreinte: v.empreinte, statut, zonesVisibles: listeDeTextes(v.zonesVisibles), zonesNonVisibles: listeDeTextes(v.zonesNonVisibles), verdict, conseil: texteOuNull(v.conseil), raison: texteOuNull(v.raison) };
}

function lireSelections(v: unknown): EtatSimulateur["selections"] {
  if (!estObjet(v)) return {};
  const lues: EtatSimulateur["selections"] = {};
  for (const [zone, sel] of Object.entries(v)) {
    if (sel === null) lues[zone] = null;
    else if (estObjet(sel) && typeof sel.ref === "string") lues[zone] = { ref: sel.ref, nom: String(sel.nom ?? ""), famille: String(sel.famille ?? ""), finition: String(sel.finition ?? ""), categorie: String(sel.categorie ?? ""), tags: Array.isArray(sel.tags) ? sel.tags.map(String) : [], image: String(sel.image ?? "") };
  }
  return lues;
}

/**
 * Convertit ce qui sort d'IndexedDB en état v2. L'ancien état v1 (résultat et
 * `rendusLocaux` en base64) repart sans image : ses `simulationSiteIds` sont
 * gardés dans `rendus` sans adresse (le CRM les a ; ils partent avec la demande
 * de devis). Rien d'illisible ne fait échouer : on repart de zéro.
 */
export function migrerEtat(brut: unknown): EtatSimulateur | null {
  if (!estObjet(brut)) return null;
  const projet = typeof brut.projet === "string" && brut.projet ? brut.projet : "cuisine";
  const majLe = typeof brut.majLe === "number" ? brut.majLe : 0;
  const photo = texteOuNull(brut.photo);
  const base: EtatSimulateur = { projet, photo, photoLargeur: photo ? entierPositifOuNull(brut.photoLargeur) : null, photoHauteur: photo ? entierPositifOuNull(brut.photoHauteur) : null, selections: lireSelections(brut.selections), parcoursId: texteOuNull(brut.parcoursId), parcoursNeLe: typeof brut.parcoursNeLe === "number" && brut.parcoursNeLe > 0 ? brut.parcoursNeLe : majLe, travailEnCours: null, rendus: [], analyse: lireAnalyse(brut.analyse), ville: texteOuNull(brut.ville), codePostal: typeof brut.codePostal === "string" && /^\d{5}$/.test(brut.codePostal) ? brut.codePostal : null, refDemandee: texteOuNull(brut.refDemandee), majLe };
  if (brut.version === 2) {
    const t = brut.travailEnCours;
    return {
      ...base,
      travailEnCours: estObjet(t) && typeof t.travailId === "string" ? { travailId: t.travailId, lanceLe: typeof t.lanceLe === "number" ? t.lanceLe : majLe, attenteEstimeeS: typeof t.attenteEstimeeS === "number" ? t.attenteEstimeeS : ATTENTE_PAR_DEFAUT_S } : null,
      rendus: Array.isArray(brut.rendus)
        ? brut.rendus.filter(estObjet).filter((r) => typeof r.travailId === "string").map((r) => ({ travailId: String(r.travailId), simulationSiteId: texteOuNull(r.simulationSiteId), urlApres: String(r.urlApres ?? ""), urlAvant: texteOuNull(r.urlAvant), references: lireReferences(r.references), le: typeof r.le === "number" ? r.le : majLe }))
        : [],
    };
  }
  // v1 : identifiants gardés, images abandonnées (elles pesaient plusieurs Mo).
  const ids = Array.isArray(brut.simulationSiteIds) ? brut.simulationSiteIds.filter((id): id is string => typeof id === "string" && /^[a-z0-9]{10,40}$/i.test(id)) : [];
  const resultat = estObjet(brut.resultat) ? brut.resultat : null;
  return {
    ...base,
    rendus: ids.map((id) => ({ travailId: `v1:${id}`, simulationSiteId: id, urlApres: "", urlAvant: null, references: resultat && resultat.simulationSiteId === id ? lireReferences(resultat.references) : [], le: majLe })),
  };
}

/* ── Décision au montage de /simulateur ─────────────────────────── */

export type DecisionMontage =
  /** Un travail est en cours (ou un lien ?reprise=) : reprendre le sondage. `parcoursId` : celui que le lien porte (`&p=`), à adopter. */
  | { ecran: "attente"; travail: TravailEnCours; parcoursId?: string }
  /** Un parcours récent existe : proposer de le reprendre, sans écraser. */
  | { ecran: "bandeau"; etape: 2 | 3 }
  /**
   * Repartir directement à l'étape voulue (rien à reprendre). `pieceChoisie` (site 3.0,
   * lot B6) : la pièce de l'adresse a été CHOISIE par un picto de l'accueil (`?choix=1`) — le simulateur émet
   * `PIECE_CHOISIE` et ouvre l'écran Photo.
   */
  | { ecran: "direct"; etape: 1 | 2 | 3; pieceChoisie?: true };

const TRAVAIL_ID = /^[a-z0-9]{10,40}$/i;
const PARCOURS_ID = /^[0-9a-fA-F-]{16,64}$/;

/**
 * Le lien du mail « simulation prête » porte le travail ET son parcours
 * (`?reprise=<travailId>&p=<parcoursId>`) : le suivi du CRM exige les deux.
 * Ouvert sur un autre appareil, sans mémoire locale, le site adopte ce parcours
 * avant de sonder — sinon il sonderait avec un parcours neuf et lirait 404.
 */
export function decisionAuMontage(etat: EtatSimulateur | null, options: { reprise?: string | null; p?: string | null; choix?: boolean; maintenant?: number } = {}): DecisionMontage {
  const maintenant = options.maintenant ?? Date.now();
  if (options.reprise && TRAVAIL_ID.test(options.reprise)) {
    const rendu = etat?.rendus.find((r) => r.travailId === options.reprise);
    const parcoursId = options.p && PARCOURS_ID.test(options.p) ? options.p : undefined;
    return { ecran: "attente", travail: { travailId: options.reprise, lanceLe: rendu?.le ?? maintenant, attenteEstimeeS: 0 }, ...(parcoursId ? { parcoursId } : {}) };
  }
  if (etat?.travailEnCours) return { ecran: "attente", travail: etat.travailEnCours };
  // `choix` : une pièce valide choisie sur l'accueil (le simulateur vérifie la pièce), sans photo en mémoire. Avec une
  // photo, le bandeau de reprise passe d'abord (la pièce de l'adresse reste présélectionnée) : rien n'est écrasé.
  if (options.choix && !etat?.photo) return { ecran: "direct", etape: 1, pieceChoisie: true };
  if (!etat) return { ecran: "direct", etape: 1 };
  const dernier = etat.rendus[etat.rendus.length - 1];
  const etape: 2 | 3 | 1 = dernier?.urlApres ? 3 : etat.photo ? 2 : 1;
  if (etape === 1) return { ecran: "direct", etape: 1 };
  if (maintenant - etat.majLe < 0) return { ecran: "direct", etape: etat.photo ? 2 : 1 };
  if (maintenant - etat.majLe > REPRISE_MAX_MS) return { ecran: "direct", etape: 1 };
  return { ecran: "bandeau", etape };
}

/* ── Machine d'état du sondage ──────────────────────────────────── */

export type ReponseSuivi = {
  statut: "EN_ATTENTE" | "EN_COURS" | "PRETE" | "ECHEC";
  etape?: string | null;
  attenteEstimeeS?: number;
  /** Début de la génération côté CRM (ISO) : c'est depuis là, et seulement EN_COURS, que se compte un délai dépassé. */
  demarreLe?: string | null;
  simulationSiteId?: string | null;
  references?: ReferenceRendu[];
  erreur?: { raison: string; message: string };
};

export type EvenementSondage = { type: "reponse"; reponse: ReponseSuivi } | { type: "http"; status: number } | { type: "reseau" };

export type EtatSondage = TravailEnCours & { etape: string | null; horsLigne: boolean; echecsReseau: number; statut: "EN_ATTENTE" | "EN_COURS" };

export type Transition =
  | { suite: "continuer"; etat: EtatSondage }
  | { suite: "pret"; etat: EtatSondage; reponse: ReponseSuivi }
  | { suite: "echec"; etat: EtatSondage; raison: string; message: string };

/** Sondage : toutes les 3 s ; sans réponse, on n'abandonne qu'après ce délai (le travail continue côté CRM). */
export const INTERVALLE_SONDAGE_MS = 3_000;
export const HORS_LIGNE_MAX_MS = 10 * 60_000;
/**
 * Un travail EN_COURS depuis plus longtemps est perdu : même règle que le CRM
 * (`TRAVAIL_PERDU_APRES_MS`, 10 min), comptée depuis SON `demarreLe`, jamais
 * depuis le lancement côté navigateur — une file d'attente (deux générations
 * en parallèle au plus) n'est pas un échec, et le CRM gère lui-même les 30 min
 * d'un travail jamais pris.
 */
export const EN_COURS_MAX_MS = 10 * 60_000;

/*
 * Les messages d'échec disent la cause et l'action suivante. L'écran d'attente
 * met le titre (« Nous n'avons pas réussi cette fois-ci. ») ; aucun message ne
 * le répète.
 */
export const MESSAGE_INJOIGNABLE = "Le service de simulation ne répond pas pour l'instant. Votre photo et vos choix sont conservés : réessayez dans un instant.";
export const MESSAGE_ECHEC_GENERIQUE = "Votre photo et vos choix sont conservés : réessayez, ou laissez-nous vos coordonnées et nous vous envoyons la simulation.";
export const MESSAGE_DELAI = "La génération a pris trop de temps. Votre photo et vos choix sont conservés : réessayez, ou laissez-nous vos coordonnées et nous vous envoyons la simulation.";
export const MESSAGE_INTROUVABLE = "Nous ne retrouvons pas cette simulation. Votre photo et vos choix sont conservés : relancez-la.";
/** Sans photo sur cet appareil (lien d'un mail, mémoire vide), « conservés » serait faux : on le dit honnêtement. */
export const MESSAGE_SANS_PHOTO = "Nous ne retrouvons pas cette simulation sur cet appareil. Si un mail vous l'a annoncée, le rendu y est joint ; pour en faire une nouvelle, commencez par une photo.";
/** La case cochée sous « Me prévenir » : transmise au CRM comme preuve du consentement. */
export const TEXTE_CONSENTEMENT_PREVENIR = "J'accepte que CoverSwap me contacte au sujet de cette simulation (un e-mail au plus si j'ai donné une adresse ; par téléphone, un rappel de notre part, jamais de SMS automatique).";

/* ── Analyse de la photo (partie 4) : ce que le CRM rend, réduit pour l'écran ── */

export const VERDICTS: readonly VerdictPhoto[] = ["bonne", "floue", "sombre", "contre-jour", "trop-loin"];

/** Réponse de `POST|GET /api/simulate/analyse` telle que le site la lit. */
export type ReponseAnalyseCrm = {
  empreinte: string;
  statut: "EN_COURS" | "PRETE" | "SAUTEE" | "ECHEC";
  analyse?: { zones_visibles?: Record<string, { visible?: boolean; description?: string }>; qualite_photo?: { verdict?: string; conseil?: string } } | null;
  raison?: string | null;
};

/** La phrase neutre dite au visiteur quand l'analyse n'a pas pu être faite (le code de raison reste au CRM). */
export const MESSAGE_ANALYSE_SAUTEE = "L'analyse de la photo n'a pas pu être faite : vous pouvez lancer la simulation sans.";

export function reduireAnalyse(reponse: ReponseAnalyseCrm): EtatAnalyse {
  const zones = reponse.analyse?.zones_visibles ?? {};
  const zonesVisibles = Object.entries(zones).filter(([, z]) => z?.visible === true).map(([id]) => id);
  const zonesNonVisibles = Object.entries(zones).filter(([, z]) => z?.visible === false).map(([id]) => id);
  const verdictBrut = reponse.analyse?.qualite_photo?.verdict;
  const verdict = typeof verdictBrut === "string" && VERDICTS.includes(verdictBrut as VerdictPhoto) ? (verdictBrut as VerdictPhoto) : null;
  const conseil = reponse.statut === "PRETE" && verdict && verdict !== "bonne" ? reponse.analyse?.qualite_photo?.conseil?.trim() || null : null;
  return { empreinte: reponse.empreinte, statut: reponse.statut, zonesVisibles, zonesNonVisibles, verdict: reponse.statut === "PRETE" ? verdict : null, conseil, raison: reponse.statut === "SAUTEE" || reponse.statut === "ECHEC" ? (reponse.raison ?? "erreur") : null };
}

/**
 * Une zone choisie n'est pas visible sur la photo si TOUTES ses composantes
 * connues de l'analyse le sont ; une zone que l'analyse ne connaît pas n'est
 * jamais grisée (la règle du CRM : ne jamais bloquer à tort).
 */
export function zoneNonVisible(analyse: EtatAnalyse | null, composantes: string[]): boolean {
  if (!analyse || analyse.statut !== "PRETE") return false;
  const connues = composantes.filter((c) => analyse.zonesVisibles.includes(c) || analyse.zonesNonVisibles.includes(c));
  return connues.length > 0 && connues.every((c) => analyse.zonesNonVisibles.includes(c));
}

/** Le titre du conseil de qualité, par verdict (la phrase du CRM, au vouvoiement, vient dessous). */
export const TITRES_VERDICT: Record<Exclude<VerdictPhoto, "bonne">, string> = {
  floue: "Votre photo semble floue",
  sombre: "Votre photo semble sombre",
  "contre-jour": "Votre photo est à contre-jour",
  "trop-loin": "Votre photo est prise de trop loin",
};

export function debuterSondage(travail: TravailEnCours): EtatSondage {
  return { ...travail, etape: null, horsLigne: false, echecsReseau: 0, statut: "EN_ATTENTE" };
}

export function reduireSondage(etat: EtatSondage, evenement: EvenementSondage, maintenant: number = Date.now()): Transition {
  if (evenement.type === "reponse") {
    const r = evenement.reponse;
    const suivant: EtatSondage = { ...etat, horsLigne: false, echecsReseau: 0, etape: r.etape ?? etat.etape, attenteEstimeeS: r.attenteEstimeeS && r.attenteEstimeeS > 0 ? r.attenteEstimeeS : etat.attenteEstimeeS };
    if (r.statut === "PRETE") return { suite: "pret", etat: { ...suivant, etape: "rendu" }, reponse: r };
    if (r.statut === "ECHEC") return { suite: "echec", etat: suivant, raison: r.erreur?.raison ?? "erreur", message: r.erreur?.message ?? MESSAGE_ECHEC_GENERIQUE };
    if (r.statut === "EN_COURS") {
      const demarreLe = r.demarreLe ? Date.parse(r.demarreLe) : Number.NaN;
      if (maintenant - (Number.isFinite(demarreLe) ? demarreLe : etat.lanceLe) > EN_COURS_MAX_MS) return { suite: "echec", etat: suivant, raison: "delai", message: MESSAGE_DELAI };
    }
    return { suite: "continuer", etat: { ...suivant, statut: r.statut } };
  }
  if (evenement.type === "http" && evenement.status === 404) return { suite: "echec", etat, raison: "introuvable", message: MESSAGE_INTROUVABLE };
  if (evenement.type === "http" && evenement.status >= 400 && evenement.status < 500) return { suite: "echec", etat, raison: `http-${evenement.status}`, message: MESSAGE_ECHEC_GENERIQUE };
  const suivant: EtatSondage = { ...etat, horsLigne: true, echecsReseau: etat.echecsReseau + 1 };
  if (maintenant - etat.lanceLe > HORS_LIGNE_MAX_MS) return { suite: "echec", etat: suivant, raison: "injoignable", message: MESSAGE_INJOIGNABLE };
  return { suite: "continuer", etat: suivant };
}

/* ── Écran d'attente : étapes et attente en mots ────────────────── */

export const ETAPES_ATTENTE = [
  { cle: "analyse", titre: "Lecture de votre photo", phrase: "Nous repérons vos façades, votre plan et vos objets pour ne rien déplacer." },
  { cle: "matieres", titre: "Préparation des matières", phrase: "Chaque film est décrit au rendu : teinte, veinage, finition." },
  { cle: "rendu", titre: "Rendu photographique", phrase: "L'image est calculée à partir de votre photo, sans rien déplacer." },
] as const;

/** Cases cochées d'après l'étape du travail : `rendu` (partie 1) coche les deux premières, PRETE coche tout. */
export function etapesCochees(etape: string | null | undefined, statut: "EN_ATTENTE" | "EN_COURS" | "PRETE" | "ECHEC" = "EN_COURS"): boolean[] {
  if (statut === "PRETE") return [true, true, true];
  const index = ETAPES_ATTENTE.findIndex((e) => e.cle === etape);
  return ETAPES_ATTENTE.map((_, i) => index >= 0 && i < index);
}

/** « environ 1 min 30 » (arrondi à 15 s, jamais une barre). */
export function texteAttente(attenteEstimeeS: number): string {
  const s = Math.max(15, Math.round(Math.max(0, attenteEstimeeS) / 15) * 15);
  if (s < 60) return `environ ${s} s`;
  const min = Math.floor(s / 60);
  const reste = s % 60;
  return reste === 0 ? `environ ${min} min` : `environ ${min} min ${String(reste).padStart(2, "0")}`;
}
