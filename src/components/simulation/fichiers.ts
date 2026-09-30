/**
 * Un rendu en fichier (mission 15, partie 5 : extrait de l'écran résultat du
 * site, partagé avec l'espace client) : téléchargé, ou partagé (Web Share API
 * avec le fichier), avec repli sur le téléchargement.
 */
export async function fichierDuRendu(url: string, nom: string): Promise<File | null> {
  try {
    const reponse = await fetch(url, { cache: "force-cache" });
    if (!reponse.ok) return null;
    const blob = await reponse.blob();
    return new File([blob], nom, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

export function telechargerFichier(fichier: File): void {
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(fichier);
  lien.download = fichier.name;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
}

/** Partage le fichier si le téléphone le permet (Web Share), sinon le télécharge ; dit ce qui a été fait. */
export async function partagerOuTelecharger(fichier: File, donnees: { title: string; text: string }): Promise<"partage" | "telechargement" | "annule"> {
  const partage = { files: [fichier], ...donnees };
  if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(partage))) {
    try {
      await navigator.share(partage);
      return "partage";
    } catch {
      return "annule";
    }
  }
  telechargerFichier(fichier);
  return "telechargement";
}
