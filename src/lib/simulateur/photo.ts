/**
 * Préparation de la photo côté navigateur : lecture (y compris HEIC quand le
 * navigateur sait le décoder), réduction à 1600 px, JPEG. Le simulateur ne
 * reçoit jamais un fichier de 10 Mo, et une photo illisible donne un message
 * précis au lieu d'un échec muet.
 */
export const COTE_MAX = 1600;
export const POIDS_MAX_OCTETS = 25 * 1024 * 1024;

export type ErreurPhoto = "trop-lourde" | "format" | "illisible";

function estHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function decoder(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* on tente par <img> */
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

export async function preparerPhoto(file: File): Promise<{ dataUrl: string; largeur: number; hauteur: number; poidsKo: number }> {
  if (file.size > POIDS_MAX_OCTETS) throw new Error("trop-lourde" satisfies ErreurPhoto);
  if (!file.type.startsWith("image/") && !estHeic(file)) throw new Error("format" satisfies ErreurPhoto);
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decoder(file);
  } catch {
    throw new Error((estHeic(file) ? "format" : "illisible") satisfies ErreurPhoto);
  }
  const largeurSource = "naturalWidth" in source ? source.naturalWidth : source.width;
  const hauteurSource = "naturalHeight" in source ? source.naturalHeight : source.height;
  const ratio = Math.min(1, COTE_MAX / Math.max(largeurSource, hauteurSource));
  const largeur = Math.max(1, Math.round(largeurSource * ratio));
  const hauteur = Math.max(1, Math.round(hauteurSource * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("illisible" satisfies ErreurPhoto);
  ctx.drawImage(source, 0, 0, largeur, hauteur);
  if ("close" in source) source.close();
  const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
  return { dataUrl, largeur, hauteur, poidsKo: Math.round((dataUrl.length * 3) / 4 / 1024) };
}

export function messageErreurPhoto(code: string): string {
  switch (code) {
    case "trop-lourde":
      return "Cette photo dépasse 25 Mo. Choisissez une photo plus légère, ou faites une capture d'écran.";
    case "format":
      return "Ce format n'est pas lisible par votre navigateur (souvent un HEIC). Sur iPhone : Réglages → Appareil photo → Formats → « Le plus compatible », ou envoyez une capture d'écran de la photo.";
    default:
      return "Impossible de lire cette photo. Essayez une autre photo, en JPEG ou PNG.";
  }
}
