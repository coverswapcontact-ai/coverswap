/**
 * L'espace client parle au CRM, et à lui seul : chaque adresse part du jeton
 * signé de la page (`racine`). Aucun outil de mesure, aucun tiers — même les
 * échantillons du catalogue passent par le CRM.
 */

export type ZoneTeinte = { zone: string; libelle: string; ref: string; nom: string };
export type EtapeEspace = "PHOTOS" | "PROJET" | "SIMULATIONS" | "ATTENTE_SIMULATION" | "ATTENTE_DEVIS" | "DEVIS" | "ACOMPTE" | "CHANTIER" | "TERMINE";
export type CleProgression = "PHOTOS" | "PROJET" | "SIMULATIONS" | "DEVIS" | "ACOMPTE";

/** Une famille de prestations (cuisine, salle de bain, mobilier, professionnel) : fichier unique du CRM. */
export type IdFamille = "CUISINE" | "SDB" | "MEUBLES" | "PRO";
/** Ce que le client a coché : `{ CUISINE: ["facades-hautes", …], SDB: [] }`. */
export type SelectionPrestations = Partial<Record<IdFamille, string[]>>;
export type TailleProjet = { repere: string | null; valeur: number | null };

export type QuestionTaille = { titre: string; aide: string; unite: "m" | "portes"; min: number; max: number; pas: number; depart: number; reperes: { id: string; libelle: string; aide: string; valeur: number }[]; requise: boolean };
export type PrisePhoto = { titre: string; aide: string; cadre?: "ensemble" | "hauts" | "bas" | "plan" | "detail" };
export type FamillePublique = {
  id: IdFamille;
  libelle: string;
  aide: string;
  mots: { nom: string; votre: string; de: string };
  projetSimulateur: string;
  sousParties: { id: string; libelle: string; aide: string }[];
  taille: QuestionTaille;
  photos: PrisePhoto[];
};
export type Prestations = { version: 1; familles: FamillePublique[] };

/** Le projet (mission 5) : ses familles et sous-parties, la taille par famille, un mot. Les champs d'avant restent lus. */
export type ProjetClient = {
  familles?: SelectionPrestations;
  tailles?: Partial<Record<IdFamille, TailleProjet>>;
  zones: string[];
  styles: string[];
  propositions: boolean;
  metres: number | null;
  repere: string | null;
  delai: string | null;
  precisions: string;
};

/** SITE : son essai sur coverswap.fr ; CLIENT : créée par lui dans son espace ; CRM : préparée par CoverSwap. */
export type SourceSimulation = "SITE" | "CRM" | "CLIENT";

/** Les simulations qu'il crée lui-même : ce qu'il lui reste, ce qui tourne, et si le service répond. */
export type Piece = { piece: string; libelle: string; aide: string; zones: { zone: string; libelle: string }[]; cochees?: string[]; duProjet?: boolean };

export type Creation = {
  gratuites: number;
  accordees: number;
  /** Faites dans l'espace ET sur coverswap.fr : les deux comptent. */
  faites: number;
  faitesSite?: number;
  restantes: number;
  enCours: { id: string; le: string }[];
  demandeesLe: string | null;
  disponible: boolean;
  zones: { zone: string; libelle: string }[];
  zonesProjet: string[];
  /** Toutes les pièces du simulateur du site ; `piece` : celle de son projet. (Absents d'un état gardé avant le 22/09.) */
  piece?: string;
  pieces?: Piece[];
};

/** Une ligne de paiement : ce qui est dû, ce qui est payé, quand et comment. */
export type LignePaiement = { montant: number; statut: "PAYE" | "PARTIEL" | "A_REGLER"; recu: number; payeLe: string | null; moyen: string | null };

export type Paiement = {
  devisNumero: string;
  signeLe: string | null;
  total: number;
  recu: number;
  reste: number;
  acompte: (LignePaiement & { pct: number | null }) | null;
  solde: LignePaiement;
  encaissements: { montant: number; le: string; moyen: string | null }[];
  regle: boolean;
};

export type Onglet = { cle: CleProgression; libelle: string; fait: boolean; courante: boolean; verrouillee?: boolean; raison?: string | null };

export type SimulationClient = {
  id: string;
  titre: string | null;
  description: string | null;
  source: SourceSimulation;
  zones: ZoneTeinte[];
  avant: boolean;
  le: string;
  nouvelle: boolean;
  choisie: boolean;
  commentaire: string | null;
};

export type LigneDevis = { type: "SECTION"; libelle: string } | { type: "PRESTATION"; designation: string; detail: string | null; quantite: number; unite: string; prixUnitaire: number; total: number };

export type Choix =
  | { mode: "UNE"; simulationId: string; commentaire: string | null; le: string }
  | { mode: "COMPOSITE"; zones: (ZoneTeinte & { simulationId: string })[]; commentaire: string | null; le: string };

export type Etat = {
  version?: 2;
  apercu?: boolean;
  /** Mission 5 : ce projet dans l'espace permanent du client. */
  code?: string;
  nomProjet?: string;
  fige?: "TERMINE" | "NON_REALISE" | null;
  familles?: IdFamille[];
  famillesSuggerees?: IdFamille[];
  /** « votre salle de bain » quand la famille est connue, « votre projet » sinon. */
  mots?: { nom: string; votre: string; de: string };
  projetModifiable?: { ok: boolean; raison: string | null };
  prenom: string;
  nom: string;
  ville: string;
  typeProjet: string;
  projet: string;
  etape: EtapeEspace;
  etapes: Onglet[];
  photos: { id: string }[];
  monProjet: ProjetClient | null;
  /** Projet validé (pastille verte) ; `projetManque` : ce qu'il faut encore pour pouvoir le valider. */
  projetValide?: { le: string; par: "CLIENT" | "LUCAS" } | null;
  projetManque?: string | null;
  connu: { tailleCuisine: string | null; delai: string | null; delaiTexte: string | null; proprietaire: boolean | null; zones: string[]; refsSite: string[] };
  simulations: SimulationClient[];
  simulationsEnPreparation: { delai: string } | null;
  propositionDemandeeLe: string | null;
  propositionMessage?: string | null;
  choix: Choix | null;
  /** « Vérifiez vos coordonnées » : les siennes (prénom, nom, e-mail, téléphone) et l'adresse de ce projet. */
  coordonnees: { nom: string; prenom?: string; nomFamille?: string; telephone?: string; adresse: string; codePostal: string; ville: string; email: string | null; completes: boolean; manque?: string[] };
  devis: {
    id: string;
    numero: string;
    objet: string;
    lignes: LigneDevis[];
    total: number;
    acompte: number;
    acomptePct: number | null;
    solde: number;
    conditions: string[];
    mentionTva: string;
    emisLe: string;
    valableJusquau: string;
    /** ESPACE : bon pour accord donné ici (retirable tant que rien n'est engagé) ; CRM : signé hors de l'espace. */
    accepte: { le: string; nom: string; source?: "ESPACE" | "CRM"; retirable?: boolean } | null;
    /** Devis émis avant le CRM : pas de détail ligne à ligne. */
    repris?: boolean;
    pdf: string | null;
  } | null;
  paiement?: Paiement | null;
  acompte: { montant: number; recu: number; complet: boolean } | null;
  virement: { titulaire: string; iban: string; bic: string; reference: string } | null;
  paiementCarte: boolean;
  chantier: { date: string | null } | null;
  apres: { photos: { id: string }[]; avis: { note: number; texte: string; le: string } | null } | null;
  contact: { nom: string; prenom: string; role: string; telephone: string; telephoneLien: string; portrait: boolean };
  /** v3 : l'espace parle au nom de CoverSwap ; le numéro reste celui de Lucas. (Absents d'un état gardé avant la v3.) */
  marque?: { nom: string; telephone: string; telephoneLien: string };
  creation?: Creation;
  favoris?: string[];
  choixModifiable?: boolean;
  expireLe: string;
};

/** Un projet sur l'accueil « Mes projets ». */
export type ProjetCarte = {
  code: string;
  nom: string;
  familles: { id: IdFamille; libelle: string }[];
  pastille: "A_VOUS" | "COVERSWAP" | "EN_COURS" | "TERMINE" | "NON_REALISE";
  libellePastille: string;
  prochaine: string | null;
  fige: "TERMINE" | "NON_REALISE" | null;
  depuis: string;
};

export type DocumentClient = { id: string; type: "DEVIS" | "FACTURE" | "AVOIR"; numero: string; le: string; montant: number; statut: string; projet: string; pdf: string | null };

/** L'espace du client, au-dessus de ses projets : ses projets, ses documents, ses favoris, la confirmation. */
export type MessageClient = { id: string; le: string; auteur: "CLIENT" | "COVERSWAP"; texte: string; projet: string | null; vue: boolean };

export type Compte = {
  version: 3;
  prenom: string;
  confirmation: { requise: boolean } | null;
  projets: ProjetCarte[];
  projetCourant: string | null;
  nouveauProjet: { possible: boolean; enCours: number; limite: number; demandeLe: string | null };
  documents: DocumentClient[];
  favoris: string[];
  /** Mission 10 : ses échanges avec CoverSwap (tous projets), du plus ancien au plus récent. */
  messages?: MessageClient[];
  reponsesNonVues?: number;
  prestations: Prestations;
  marque: { nom: string; telephone: string; telephoneLien: string; email: string | null };
};

/** Ce que rend l'API : le projet affiché (ou aucun : l'accueil « Mes projets »), et l'espace entier. */
export type Reponse = { espace: Etat | null; compte?: Compte };

/** Le numéro à appeler, au nom de CoverSwap (un état gardé d'avant la v3 n'a que `contact`). */
export const marqueDe = (etat: Etat) => etat.marque ?? { nom: "CoverSwap", telephone: etat.contact.telephone, telephoneLien: etat.contact.telephoneLien };

/** Aperçu depuis le CRM : chaque geste le dit, rien ne part. */
export const MESSAGE_APERCU = "Aperçu : c'est la vue de votre client, en lecture seule. Rien n'est enregistré.";

export class ErreurEspace extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly raison?: string
  ) {
    super(message);
  }

  /** Passager (réseau coupé, serveur qui souffle) : on garde et on réessaie ; sinon, on le dit. */
  get passager(): boolean {
    return this.status === 0 || this.status >= 500 || this.status === 429;
  }
}

export type Client = {
  racine: string;
  apercu: string | null;
  /** Adresse d'une ressource de l'espace (photo, simulation, échantillon, devis), aperçu compris. */
  url: (chemin: string) => string;
  appeler: <T>(chemin: string, init?: RequestInit) => Promise<T>;
  envoyerJson: <T>(chemin: string, methode: "POST" | "PUT", corps: unknown) => Promise<T>;
};

/**
 * `projet` : le code du projet affiché ; chaque appel le porte (`?projet=`), le
 * CRM vérifie qu'il est bien un projet de ce client. Sans lui : l'espace entier.
 */
export function creerClient(racine: string, apercu: string | null, surReseau: (enLigne: boolean) => void, projet: string | null = null): Client {
  const url = (chemin: string) => {
    const parametres = [projet ? `projet=${encodeURIComponent(projet)}` : null, apercu ? `apercu=${encodeURIComponent(apercu)}` : null].filter(Boolean).join("&");
    return `${racine}${chemin}${parametres ? `${chemin.includes("?") ? "&" : "?"}${parametres}` : ""}`;
  };
  const appeler = async <T,>(chemin: string, init?: RequestInit): Promise<T> => {
    let reponse: Response;
    try {
      reponse = await fetch(url(chemin), { ...init, cache: "no-store", referrerPolicy: "no-referrer" });
    } catch {
      surReseau(false);
      throw new ErreurEspace("Pas de réseau pour l'instant. Rien n'est perdu\u00a0: réessayez dans un moment.", 0);
    }
    surReseau(true);
    const corps = (await reponse.json().catch(() => ({}))) as { error?: string; raison?: string };
    if (!reponse.ok) throw new ErreurEspace(corps.error ?? "Un souci de notre côté. Réessayez dans un instant.", reponse.status, corps.raison);
    return corps as T;
  };
  return {
    racine,
    apercu,
    url,
    appeler,
    // En aperçu, aucun geste ne part — et aucun ne reste muet : l'écran affiche pourquoi.
    envoyerJson: (chemin, methode, corps) =>
      apercu ? Promise.reject(new ErreurEspace(MESSAGE_APERCU, 403, "apercu")) : appeler(chemin, { method: methode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) }),
  };
}

/** Envoi d'une photo avec sa progression (fetch ne la donne pas). */
export function envoyerPhoto(client: Client, fichier: Blob, nom: string, progression: (part: number) => void): Promise<{ espace?: Etat; refusees?: string[] }> {
  return new Promise((resoudre, rejeter) => {
    const requete = new XMLHttpRequest();
    requete.open("POST", client.url("/photos"));
    requete.timeout = 120_000;
    requete.upload.onprogress = (e) => {
      if (e.lengthComputable) progression(e.loaded / e.total);
    };
    requete.onload = () => {
      let corps: { error?: string; espace?: Etat; refusees?: string[] } = {};
      try {
        corps = JSON.parse(requete.responseText || "{}");
      } catch {
        corps = {};
      }
      if (requete.status >= 200 && requete.status < 300) resoudre(corps);
      else rejeter(new ErreurEspace(corps.error ?? "Photo refusée.", requete.status));
    };
    const coupure = () => rejeter(new ErreurEspace("Réseau coupé\u00a0: la photo repartira toute seule.", 0));
    requete.onerror = coupure;
    requete.ontimeout = coupure;
    const formulaire = new FormData();
    formulaire.append("photos", fichier, nom);
    requete.send(formulaire);
  });
}

export const euros = (montant: number) => montant.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: montant % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });

export const dateLongue = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
export const dateCourte = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/**
 * Les mots de l'écran, dits à la manière du client : « votre salle de bain »
 * quand sa famille est connue, « votre projet » sinon — jamais « votre cuisine »
 * par défaut. Viennent du CRM (fichier des prestations) ; un état gardé d'avant
 * les familles retombe sur « votre projet ».
 */
export function motsDe(etat: Pick<Etat, "mots">): { nom: string; votre: string; de: string } {
  return etat.mots ?? { nom: "projet", votre: "votre projet", de: "de votre projet" };
}

/** Les familles du projet : cochées, sinon devinées de sa demande. */
export const famillesDe = (etat: Pick<Etat, "familles" | "famillesSuggerees">): IdFamille[] => (etat.familles?.length ? etat.familles : (etat.famillesSuggerees ?? []));
