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

export type EtatSimulateur = {
  projet: string;
  /** La photo réduite (data URL), la seule image gardée ici. */
  photo: string | null;
  selections: Record<string, Selection | null>;
  /** Copié depuis le sessionStorage : il survit à la fermeture de l'onglet. */
  parcoursId: string | null;
  travailEnCours: TravailEnCours | null;
  /** Historique du parcours, le plus récent en fin de liste. */
  rendus: RenduSimulateur[];
  majLe: number;
};

export const ETAT_VIDE: EtatSimulateur = { projet: "cuisine", photo: null, selections: {}, parcoursId: null, travailEnCours: null, rendus: [], majLe: 0 };

/** Au-delà, un parcours n'est plus proposé à la reprise (les rendus du CRM sont purgés à 30 jours). */
export const REPRISE_MAX_MS = 30 * 24 * 60 * 60 * 1000;

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const texteOuNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

function lireReferences(v: unknown): ReferenceRendu[] {
  return Array.isArray(v) ? v.filter(estObjet).map((r) => ({ zone: String(r.zone ?? ""), libelle: String(r.libelle ?? ""), ref: String(r.ref ?? ""), nom: String(r.nom ?? "") })) : [];
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
  const base: EtatSimulateur = { projet, photo: texteOuNull(brut.photo), selections: lireSelections(brut.selections), parcoursId: texteOuNull(brut.parcoursId), travailEnCours: null, rendus: [], majLe };
  if (brut.version === 2) {
    const t = brut.travailEnCours;
    return {
      ...base,
      travailEnCours: estObjet(t) && typeof t.travailId === "string" ? { travailId: t.travailId, lanceLe: typeof t.lanceLe === "number" ? t.lanceLe : majLe, attenteEstimeeS: typeof t.attenteEstimeeS === "number" ? t.attenteEstimeeS : 75 } : null,
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
  /** Repartir directement à l'étape voulue (arrivée depuis l'accueil, ou rien à reprendre). */
  | { ecran: "direct"; etape: 1 | 2 | 3 };

const TRAVAIL_ID = /^[a-z0-9]{10,40}$/i;
const PARCOURS_ID = /^[0-9a-fA-F-]{16,64}$/;

/**
 * Le lien du mail « simulation prête » porte le travail ET son parcours
 * (`?reprise=<travailId>&p=<parcoursId>`) : le suivi du CRM exige les deux.
 * Ouvert sur un autre appareil, sans mémoire locale, le site adopte ce parcours
 * avant de sonder — sinon il sonderait avec un parcours neuf et lirait 404.
 */
export function decisionAuMontage(etat: EtatSimulateur | null, options: { reprise?: string | null; p?: string | null; depuisAccueil?: boolean; maintenant?: number } = {}): DecisionMontage {
  const maintenant = options.maintenant ?? Date.now();
  if (options.reprise && TRAVAIL_ID.test(options.reprise)) {
    const rendu = etat?.rendus.find((r) => r.travailId === options.reprise);
    const parcoursId = options.p && PARCOURS_ID.test(options.p) ? options.p : undefined;
    return { ecran: "attente", travail: { travailId: options.reprise, lanceLe: rendu?.le ?? maintenant, attenteEstimeeS: 0 }, ...(parcoursId ? { parcoursId } : {}) };
  }
  if (!etat) return { ecran: "direct", etape: 1 };
  if (etat.travailEnCours) return { ecran: "attente", travail: etat.travailEnCours };
  const dernier = etat.rendus[etat.rendus.length - 1];
  const etape: 2 | 3 | 1 = dernier?.urlApres ? 3 : etat.photo ? 2 : 1;
  if (etape === 1) return { ecran: "direct", etape: 1 };
  if (options.depuisAccueil || maintenant - etat.majLe < 0) return { ecran: "direct", etape: etat.photo ? 2 : 1 };
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
