"use client";

import { classesBouton, type VarianteBouton } from "@/components/simulation/Bouton";
import { envoyerEvenement } from "@/lib/evenements-site";
import { lienWhatsApp, MESSAGE_WHATSAPP_DEVIS } from "@/lib/whatsapp";

/**
 * « Écrire sur WhatsApp » (mission 16, partie 3) : le bouton SECONDAIRE du
 * dernier appel. Le message prérempli est court et ne porte aucune donnée
 * personnelle ; le clic est compté (`WHATSAPP_CLIQUE`, sans cookie, vers le
 * CRM). Rien n'est envoyé à la place de la personne : WhatsApp s'ouvre, elle
 * écrit. Client : le clic est compté.
 *
 * Site 3.0, lot B2 : `variante="sur-encre"` quand il est posé sur un bloc encre
 * (dernier appel) ; le secondaire à l'encre partout ailleurs.
 */
export function BoutonWhatsApp({ depuis, message = MESSAGE_WHATSAPP_DEVIS, variante = "secondaire" }: { depuis: string; message?: string; variante?: Extract<VarianteBouton, "secondaire" | "sur-encre"> }) {
  return (
    <a href={lienWhatsApp(message)} target="_blank" rel="noopener noreferrer" className={classesBouton(variante)} onClick={() => envoyerEvenement("WHATSAPP_CLIQUE", { depuis })}>
      Écrire sur WhatsApp
      <span className="sr-only"> (ouvre WhatsApp)</span>
    </a>
  );
}
