/**
 * Mémoire locale du simulateur (IndexedDB) : la photo, le projet, les choix
 * et les rendus de la session survivent à un rechargement ou à une
 * connexion coupée en cours de route. Rien ne part au serveur d'ici ; la
 * mémoire s'efface quand la personne recommence ou après sa demande.
 */
const BASE = "coverswap-simulateur";
const MAGASIN = "etat";
const CLE = "courant";

export type EtatSimulateur = {
  projet: string;
  photo: string | null;
  selections: Record<string, { ref: string; nom: string; famille: string; finition: string; categorie: string; tags: string[]; image: string } | null>;
  resultat: { image: string; simulationSiteId: string | null; references: { zone: string; libelle: string; ref: string; nom: string }[] } | null;
  /** Identifiants des simulations de la session (pour tout rattacher à la même fiche). */
  simulationSiteIds: string[];
  /** Rendus sans identifiant côté serveur (chemin de secours) : envoyés avec la demande. */
  rendusLocaux: { avant: string; apres: string; references: { zone: string; libelle: string; ref: string; nom: string }[] }[];
  majLe: number;
};

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("indexeddb"));
    const req = indexedDB.open(BASE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(MAGASIN);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function lireEtat(): Promise<EtatSimulateur | null> {
  try {
    const db = await ouvrir();
    return await new Promise((resolve) => {
      const req = db.transaction(MAGASIN, "readonly").objectStore(MAGASIN).get(CLE);
      req.onsuccess = () => resolve((req.result as EtatSimulateur) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function sauvegarderEtat(etat: EtatSimulateur): Promise<void> {
  try {
    const db = await ouvrir();
    await new Promise<void>((resolve) => {
      const req = db.transaction(MAGASIN, "readwrite").objectStore(MAGASIN).put({ ...etat, majLe: Date.now() }, CLE);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    /* mémoire locale indisponible : le simulateur marche quand même */
  }
}

export async function effacerEtat(): Promise<void> {
  try {
    const db = await ouvrir();
    await new Promise<void>((resolve) => {
      const req = db.transaction(MAGASIN, "readwrite").objectStore(MAGASIN).delete(CLE);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    /* rien à effacer */
  }
}
