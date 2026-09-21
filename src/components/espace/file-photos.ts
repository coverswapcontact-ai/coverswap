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

/**
 * Réduit une photo avant l'envoi : 2 000 px de côté au plus, JPEG, environ dix
 * fois moins lourd — passe en 4G faible. Une photo que le navigateur ne sait
 * pas lire (HEIC hors d'un iPhone) part telle quelle : le serveur l'accepte.
 */
export async function reduirePhoto(fichier: File): Promise<{ blob: Blob; nom: string }> {
  const nomSansExtension = (fichier.name || "photo").replace(/\.[^.]+$/, "");
  const heic = /\.(heic|heif)$/i.test(fichier.name) || /hei[cf]/i.test(fichier.type);
  try {
    const image = await createImageBitmap(fichier);
    const echelle = Math.min(1, 2000 / Math.max(image.width, image.height));
    if (echelle === 1 && fichier.size < 1_200_000 && fichier.type === "image/jpeg") {
      image.close();
      return { blob: fichier, nom: fichier.name || `${nomSansExtension}.jpg` };
    }
    const toile = document.createElement("canvas");
    toile.width = Math.round(image.width * echelle);
    toile.height = Math.round(image.height * echelle);
    toile.getContext("2d")?.drawImage(image, 0, 0, toile.width, toile.height);
    image.close();
    const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, "image/jpeg", 0.84));
    if (blob && blob.size < fichier.size) return { blob, nom: `${nomSansExtension}.jpg` };
  } catch {
    // illisible ici : elle part telle quelle
  }
  const type = fichier.type || (heic ? "image/heic" : "image/jpeg");
  return { blob: fichier.type ? fichier : new Blob([fichier], { type }), nom: fichier.name || `${nomSansExtension}.${heic ? "heic" : "jpg"}` };
}
