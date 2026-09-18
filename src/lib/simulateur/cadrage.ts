/**
 * Met la photo au format du modèle d'image avant l'envoi (repli synchrone).
 * Le modèle ne sort que 1536×1024, 1024×1536 ou 1024×1024 : une photo 16:9 ou
 * 4:3 envoyée telle quelle est recadrée à sa façon, et le rendu n'est plus
 * superposable. On la rogne, centrée, au bon format, et la même image rognée
 * sert d'« avant ». Même logique côté CRM (src/lib/simulations/cadrage.ts).
 * sharp est chargé à la demande : s'il manque, la photo part telle quelle.
 */
export type TailleSortie = "1536x1024" | "1024x1536" | "1024x1024";

export function tailleSelonRatio(largeur: number, hauteur: number): TailleSortie {
  const ratio = largeur / hauteur;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 0.85) return "1024x1536";
  return "1024x1024";
}

export async function rognerAuFormat(photo: Buffer, taille: TailleSortie): Promise<{ photo: Buffer; avant: Buffer | null }> {
  try {
    const charge = await import("sharp");
    const sharp = charge.default ?? charge;
    const [L, H] = taille.split("x").map(Number);
    const meta = await sharp(photo).metadata();
    if (!meta.width || !meta.height) return { photo, avant: null };
    if (Math.abs(meta.width / meta.height - L / H) < 0.02) return { photo, avant: null };
    const rognee = await sharp(photo).rotate().resize(L, H, { fit: "cover", position: "centre" }).png().toBuffer();
    return { photo: rognee, avant: await sharp(rognee).jpeg({ quality: 88 }).toBuffer() };
  } catch (e) {
    console.error("[simulation] rognage impossible, photo envoyée telle quelle :", e);
    return { photo, avant: null };
  }
}
