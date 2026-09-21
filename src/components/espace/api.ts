/**
 * L'espace client parle au CRM, et à lui seul : chaque adresse part du jeton
 * signé de la page (`racine`). Aucun outil de mesure, aucun tiers.
 */

export type ZoneTeinte = { zone: string; libelle: string; ref: string; nom: string };
export type EtapeEspace = "PHOTOS" | "PROJET" | "SIMULATIONS" | "ATTENTE_SIMULATION" | "ATTENTE_DEVIS" | "DEVIS" | "ACOMPTE" | "CHANTIER" | "TERMINE";
export type CleProgression = "PHOTOS" | "PROJET" | "SIMULATIONS" | "DEVIS" | "ACOMPTE";

export type ProjetClient = {
  zones: string[];
  styles: string[];
  propositions: boolean;
  metres: number | null;
  repere: string | null;
  delai: string | null;
  precisions: string;
};

export type SimulationClient = {
  id: string;
  titre: string | null;
  description: string | null;
  source: "SITE" | "CRM";
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
  prenom: string;
  nom: string;
  ville: string;
  typeProjet: string;
  projet: string;
  etape: EtapeEspace;
  etapes: { cle: CleProgression; libelle: string; fait: boolean; courante: boolean }[];
  photos: { id: string }[];
  monProjet: ProjetClient | null;
  connu: { tailleCuisine: string | null; delai: string | null; delaiTexte: string | null; proprietaire: boolean | null; zones: string[]; refsSite: string[] };
  simulations: SimulationClient[];
  simulationsEnPreparation: { delai: string } | null;
  propositionDemandeeLe: string | null;
  choix: Choix | null;
  coordonnees: { nom: string; adresse: string; codePostal: string; ville: string; email: string | null; completes: boolean };
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
    accepte: { le: string; nom: string } | null;
    pdf: string;
  } | null;
  acompte: { montant: number; recu: number; complet: boolean } | null;
  virement: { titulaire: string; iban: string; bic: string; reference: string } | null;
  paiementCarte: boolean;
  chantier: { date: string | null } | null;
  apres: { photos: { id: string }[]; avis: { note: number; texte: string; le: string } | null } | null;
  contact: { nom: string; prenom: string; role: string; telephone: string; telephoneLien: string; portrait: boolean };
  expireLe: string;
};

export class ErreurEspace extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly raison?: string
  ) {
    super(message);
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

export function creerClient(racine: string, apercu: string | null, surReseau: (enLigne: boolean) => void): Client {
  const url = (chemin: string) => `${racine}${chemin}${apercu ? `${chemin.includes("?") ? "&" : "?"}apercu=${encodeURIComponent(apercu)}` : ""}`;
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
    envoyerJson: (chemin, methode, corps) => appeler(chemin, { method: methode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) }),
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

/** Le projet, dit à la manière du client : « votre cuisine ». */
export function nomDuProjet(typeProjet: string): { le: string; votre: string; projet: string } {
  switch (typeProjet) {
    case "SDB":
      return { le: "la salle de bain", votre: "votre salle de bain", projet: "votre projet de salle de bain" };
    case "MEUBLES":
      return { le: "vos meubles", votre: "vos meubles", projet: "votre projet pour vos meubles" };
    case "PRO":
      return { le: "votre local", votre: "votre local", projet: "votre projet pour votre local" };
    default:
      return { le: "la cuisine", votre: "votre cuisine", projet: "votre projet de cuisine" };
  }
}
