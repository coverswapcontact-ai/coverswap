/**
 * Les photos jointes à un formulaire (contact, /pro) : 4 au plus, images seulement, 15 Mo au plus chacune, réduites
 * côté navigateur (1 300 px au plus, JPEG q 0,78 : ≈ 250 à 350 Ko) avant l'envoi au CRM. Extrait de `DevisForm`
 * (mission 16, partie 4) pour que le formulaire pro réduise ses photos de la même façon.
 */

export const MAX_PHOTOS = 4;
export const POIDS_MAX_PHOTO = 15 * 1024 * 1024;

/** Les fichiers retenus parmi ceux choisis ou déposés : images, pas trop lourdes, dans la limite des places libres. */
export function photosARetenir<T extends { type: string; size: number }>(fichiers: readonly T[], dejaLa: number): T[] {
  const places = Math.max(0, MAX_PHOTOS - dejaLa);
  return fichiers.slice(0, places).filter((f) => f.type.startsWith("image/") && f.size <= POIDS_MAX_PHOTO);
}

/** Réduit une image dans le navigateur et rend une data URL JPEG légère (la d'origine si le navigateur ne sait pas). */
export function reduirePhoto(file: File, max = 1300, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        let { width, height } = img;
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/** Les photos retenues, réduites une à une (une image illisible est passée). */
export async function reduirePhotos(fichiers: readonly File[], dejaLa: number): Promise<string[]> {
  const encodees: string[] = [];
  for (const f of photosARetenir(fichiers, dejaLa)) {
    try {
      encodees.push(await reduirePhoto(f));
    } catch {
      /* image illisible : passée */
    }
  }
  return encodees;
}
