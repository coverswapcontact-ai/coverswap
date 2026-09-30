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
