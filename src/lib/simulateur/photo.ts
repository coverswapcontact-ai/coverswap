/**
 * Préparation de la photo côté navigateur (mission 15, partie 4) : contrôle du
 * fichier (25 Mo, image), décodage avec l'orientation EXIF respectée
 * (`createImageBitmap(file, { imageOrientation: "from-image" })`, repli `<img>`),
 * réduction à 1600 px sur le grand côté, JPEG. Un HEIC que le navigateur ne
 * sait pas décoder n'est plus refusé : le fichier est renvoyé tel quel pour que
 * le CRM le convertisse (`POST /api/simulate/photo`, `generation-client.ts`).
 * Les fonctions de calcul sont pures (testées sans DOM).
 */
export const COTE_MAX = 1600;
export const POIDS_MAX_OCTETS = 25 * 1024 * 1024;
export const QUALITE_JPEG = 0.86;

export type ErreurPhoto = "trop-lourde" | "format" | "illisible";

export type FichierPhoto = { size: number; type: string; name: string };

export function estHeic(file: FichierPhoto): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** Le fichier est-il acceptable avant tout décodage ? Une raison, ou null. */
export function verifierFichier(file: FichierPhoto): ErreurPhoto | null {
  if (file.size > POIDS_MAX_OCTETS) return "trop-lourde";
  if (file.size === 0) return "illisible";
  if (!file.type.startsWith("image/") && !estHeic(file)) return "format";
  return null;
}

/** Les dimensions réduites : le grand côté ramené à `max`, jamais agrandi, jamais sous 1 px. */
export function dimensionsReduites(largeur: number, hauteur: number, max: number = COTE_MAX): { largeur: number; hauteur: number } {
  const ratio = Math.min(1, max / Math.max(1, largeur, hauteur));
  return { largeur: Math.max(1, Math.round(largeur * ratio)), hauteur: Math.max(1, Math.round(hauteur * ratio)) };
}

/** Poids approximatif (Ko) d'une data URL base64. */
export function poidsKoDe(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4 / 1024);
}

async function decoder(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // L'orientation EXIF est appliquée par le décodeur : une photo prise à la verticale reste verticale.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* option refusée ou format inconnu : on tente par <img> */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });
}

/**
 * Site 3.0 (lot E3) : la pièce d'exemple (« Essayer d'autres matières sur cette pièce ») devient un fichier JPEG comme
 * celui d'un visiteur, qui suit ensuite le même chemin (`preparerPhoto`, analyse, limites, Turnstile, quotas).
 */
export function fichierExemple(contenu: Blob, id: string): File {
  return new File([contenu], `exemple-${id}.jpg`, { type: "image/jpeg" });
}

/** L'exemple chargé comme photo : son identifiant (méta `exemple` de PHOTO_CHARGEE) et sa pièce. */
export type ExempleCharge = { id: string; piece: string };

export type PhotoPreparee = { dataUrl: string; largeur: number; hauteur: number; poidsKo: number };
/** Le navigateur ne sait pas décoder ce fichier (HEIC) : à envoyer tel quel au CRM. */
export type PhotoAConvertir = { aConvertir: true; file: File };

/**
 * Prépare la photo : data URL JPEG réduite, ou `{ aConvertir }` pour un HEIC
 * que ce navigateur ne décode pas. Lève `Error(code)` (`ErreurPhoto`) sinon.
 */
export async function preparerPhoto(file: File): Promise<PhotoPreparee | PhotoAConvertir> {
  const refus = verifierFichier(file);
  if (refus) throw new Error(refus);
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decoder(file);
  } catch {
    if (estHeic(file)) return { aConvertir: true, file };
    throw new Error("illisible" satisfies ErreurPhoto);
  }
  const largeurSource = "naturalWidth" in source ? source.naturalWidth : source.width;
  const hauteurSource = "naturalHeight" in source ? source.naturalHeight : source.height;
  const { largeur, hauteur } = dimensionsReduites(largeurSource, hauteurSource);
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("illisible" satisfies ErreurPhoto);
  ctx.drawImage(source, 0, 0, largeur, hauteur);
  if ("close" in source) source.close();
  const dataUrl = canvas.toDataURL("image/jpeg", QUALITE_JPEG);
  return { dataUrl, largeur, hauteur, poidsKo: poidsKoDe(dataUrl) };
}

/**
 * Mission 15 (partie 5) — la même réduction, en FICHIER, pour l'espace client
 * (la photo part au CRM en multipart, `POST /photos`) : même décodage avec
 * l'orientation EXIF, même réduction (2 000 px pour une photo de dossier, que
 * Lucas réutilise à pleine résolution), JPEG. Un JPEG déjà petit part tel
 * quel ; une photo que le navigateur ne sait pas lire (HEIC hors iPhone) part
 * telle quelle aussi : le CRM l'accepte. Fusion de l'ancien `reduirePhoto` de
 * `espace/file-photos.ts` (qui doublait `preparerPhoto`).
 */
export const COTE_MAX_DOSSIER = 2000;

export async function reduirePhoto(fichier: File, options: { coteMax?: number; qualite?: number } = {}): Promise<{ blob: Blob; nom: string }> {
  const coteMax = options.coteMax ?? COTE_MAX;
  const qualite = options.qualite ?? QUALITE_JPEG;
  const nomSansExtension = (fichier.name || "photo").replace(/\.[^.]+$/, "");
  const heic = estHeic(fichier);
  try {
    const source = await decoder(fichier);
    const largeurSource = "naturalWidth" in source ? source.naturalWidth : source.width;
    const hauteurSource = "naturalHeight" in source ? source.naturalHeight : source.height;
    if (Math.max(largeurSource, hauteurSource) <= coteMax && fichier.size < 1_200_000 && fichier.type === "image/jpeg") {
      if ("close" in source) source.close();
      return { blob: fichier, nom: fichier.name || `${nomSansExtension}.jpg` };
    }
    const { largeur, hauteur } = dimensionsReduites(largeurSource, hauteurSource, coteMax);
    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    canvas.getContext("2d")?.drawImage(source, 0, 0, largeur, hauteur);
    if ("close" in source) source.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", qualite));
    if (blob && blob.size < fichier.size) return { blob, nom: `${nomSansExtension}.jpg` };
  } catch {
    // illisible ici : elle part telle quelle
  }
  const type = fichier.type || (heic ? "image/heic" : "image/jpeg");
  return { blob: fichier.type ? fichier : new Blob([fichier], { type }), nom: fichier.name || `${nomSansExtension}.${heic ? "heic" : "jpg"}` };
}

export function messageErreurPhoto(code: string): string {
  switch (code) {
    case "trop-lourde":
      return "Cette photo dépasse 25 Mo. Choisissez une photo plus légère, ou faites une capture d'écran.";
    case "format":
      return "Ce format de photo n'est pas lisible. Envoyez une photo en JPEG ou PNG, ou une capture d'écran de la photo.";
    case "conversion":
      return "Nous n'avons pas pu convertir cette photo. Envoyez une capture d'écran de la photo, ou une photo en JPEG.";
    default:
      return "Impossible de lire cette photo. Essayez une autre photo, en JPEG ou PNG.";
  }
}
