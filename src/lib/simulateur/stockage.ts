/**
 * Mémoire locale du simulateur (IndexedDB) : la photo, le projet, les choix,
 * le travail en cours et l'historique des rendus du parcours survivent à un
 * rechargement, à une connexion coupée, à une page quittée pendant la
 * génération. Rien ne part au serveur d'ici ; la mémoire s'efface quand la
 * personne recommence.
 *
 * Version 2 (mission 15, partie 1) : plus aucune image de rendu en base64 —
 * les rendus sont des ADRESSES servies par le CRM (`/api/simulate/image`) ;
 * `parcoursId` est copié ici (le sessionStorage meurt avec l'onglet) et
 * `travailEnCours` permet de reprendre le sondage au retour. L'ancien état
 * (v1) est converti à la lecture (`migrerEtat`, lib/simulateur/reprise).
 */
import { migrerEtat, type EtatSimulateur } from "./reprise";

export type { EtatSimulateur, RenduSimulateur, TravailEnCours } from "./reprise";

const BASE = "coverswap-simulateur";
const MAGASIN = "etat";
const CLE = "courant";
const VERSION = 2;

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("indexeddb"));
    const req = indexedDB.open(BASE, VERSION);
    req.onupgradeneeded = () => {
      // v1 → v2 : le magasin reste (l'état v1 est converti à la lecture) ; une base neuve le crée.
      if (!req.result.objectStoreNames.contains(MAGASIN)) req.result.createObjectStore(MAGASIN);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("indexeddb-bloquee"));
  });
}

export async function lireEtat(): Promise<EtatSimulateur | null> {
  try {
    const db = await ouvrir();
    return await new Promise((resolve) => {
      const req = db.transaction(MAGASIN, "readonly").objectStore(MAGASIN).get(CLE);
      req.onsuccess = () => resolve(migrerEtat(req.result));
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
      const req = db.transaction(MAGASIN, "readwrite").objectStore(MAGASIN).put({ ...etat, version: 2, majLe: Date.now() }, CLE);
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
