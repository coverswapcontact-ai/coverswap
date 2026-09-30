"use client";

import { classesBouton } from "@/components/simulation/Bouton";
import { envoyerEvenement } from "@/lib/evenements-site";
import { lienWhatsApp, MESSAGE_WHATSAPP_DEVIS } from "@/lib/whatsapp";

/**
 * « Écrire sur WhatsApp » (mission 16, partie 3) : le bouton SECONDAIRE du
 * dernier appel. Le message prérempli est court et ne porte aucune donnée
 * personnelle ; le clic est compté (`WHATSAPP_CLIQUE`, sans cookie, vers le
 * CRM). Rien n'est envoyé à la place de la personne : WhatsApp s'ouvre, elle
 * écrit. Client : le clic est compté.
 */
export function BoutonWhatsApp({ depuis, message = MESSAGE_WHATSAPP_DEVIS }: { depuis: string; message?: string }) {
  return (
    <a href={lienWhatsApp(message)} target="_blank" rel="noopener noreferrer" className={classesBouton("secondaire")} onClick={() => envoyerEvenement("WHATSAPP_CLIQUE", { depuis })}>
      Écrire sur WhatsApp
      <span className="sr-only"> (ouvre WhatsApp)</span>
    </a>
  );
}
