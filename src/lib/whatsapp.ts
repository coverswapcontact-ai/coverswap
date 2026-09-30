import { ENTREPRISE } from "@/lib/entreprise";

/**
 * Le lien WhatsApp du site (mission 16, partie 3) : le numéro de
 * `ENTREPRISE.reseaux.whatsapp` et un message prérempli COURT, sans aucune
 * donnée personnelle (la personne écrit la suite elle-même). La partie 4 y
 * passe un message qui cite la simulation.
 */
export const MESSAGE_WHATSAPP_DEVIS = "Bonjour, je souhaite un devis pour ma cuisine.";

export function lienWhatsApp(message: string = MESSAGE_WHATSAPP_DEVIS): string {
  return `${ENTREPRISE.reseaux.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** « ma cuisine », « mes meubles »… : la pièce simulée, dans la phrase WhatsApp. */
const PIECE_DANS_LA_PHRASE: Readonly<Record<string, string>> = { cuisine: "ma cuisine", "salle-de-bain": "ma salle de bain", meubles: "mes meubles", "mur-plafond": "mes murs", professionnel: "mon local" };

/**
 * Mission 16 (partie 4) : le message prérempli après un rendu, qui cite la simulation — « Bonjour, je viens de simuler
 * ma cuisine (façades K1 Black Mat, plan de travail MK15 Travertin) sur coverswap.fr. ». Rien d'autre : ni nom, ni
 * téléphone, ni le lien de l'espace (un accès en clair dans l'adresse de wa.me et dans l'historique du navigateur ;
 * Lucas retrouve l'espace par le numéro qui écrit). La personne écrit la suite.
 */
export function messageWhatsAppSimulation(projet: string, references: readonly { libelle: string; ref: string; nom: string }[]): string {
  const films = references.map((r) => `${r.libelle.replace(/\s*\(.*?\)\s*/g, " ").trim().toLowerCase()} ${r.ref} ${r.nom}`.trim()).join(", ");
  return `Bonjour, je viens de simuler ${PIECE_DANS_LA_PHRASE[projet] ?? "mon projet"}${films ? ` (${films})` : ""} sur coverswap.fr.`;
}
