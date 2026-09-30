/**
 * La file des photos à envoyer, gardée dans le téléphone (IndexedDB) : le
 * client peut fermer la page, perdre le réseau, revenir le lendemain — ses
 * photos repartent toutes seules. Une photo n'en sort qu'une fois reçue par
 * le serveur. Sans IndexedDB (navigation privée ancienne), la file vit en
 * mémoire le temps de la visite.
 */

export type PhotoEnFile = { cle: string; jeton: string; blob: Blob; nom: string; ajouteeLe: number };

const BASE = "coverswap-espace";
const MAGASIN = "photos";
let memoire: PhotoEnFile[] = [];

function ouvrir(): Promise<IDBDatabase | null> {
  return new Promise((resoudre) => {
    try {
      if (typeof indexedDB === "undefined") return resoudre(null);
      const demande = indexedDB.open(BASE, 1);
      demande.onupgradeneeded = () => {
        if (!demande.result.objectStoreNames.contains(MAGASIN)) demande.result.createObjectStore(MAGASIN, { keyPath: "cle" });
      };
      demande.onsuccess = () => resoudre(demande.result);
      demande.onerror = () => resoudre(null);
      demande.onblocked = () => resoudre(null);
    } catch {
      resoudre(null);
    }
  });
}

async function transaction<T>(mode: IDBTransactionMode, geste: (magasin: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const base = await ouvrir();
  if (!base) return null;
  return new Promise((resoudre) => {
    try {
      const requete = geste(base.transaction(MAGASIN, mode).objectStore(MAGASIN));
      requete.onsuccess = () => resoudre(requete.result);
      requete.onerror = () => resoudre(null);
    } catch {
      resoudre(null);
    }
  });
}

export async function mettreEnFile(photo: PhotoEnFile): Promise<void> {
  const ok = await transaction("readwrite", (m) => m.put(photo));
  if (ok === null) memoire = [...memoire.filter((p) => p.cle !== photo.cle), photo];
}

export async function photosEnFile(jeton: string): Promise<PhotoEnFile[]> {
  const toutes = await transaction<PhotoEnFile[]>("readonly", (m) => m.getAll() as IDBRequest<PhotoEnFile[]>);
  return (toutes ?? memoire).filter((p) => p.jeton === jeton).sort((a, b) => a.ajouteeLe - b.ajouteeLe);
}

export async function retirerDeLaFile(cle: string): Promise<void> {
  await transaction("readwrite", (m) => m.delete(cle));
  memoire = memoire.filter((p) => p.cle !== cle);
}

// Mission 15 (partie 5) : la réduction de la photo vit dans `@/lib/simulateur/photo` (`reduirePhoto`), commune au site et à l'espace.
