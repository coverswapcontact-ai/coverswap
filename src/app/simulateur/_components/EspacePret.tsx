"use client";

import { useState } from "react";
import { Bouton, classesBouton } from "@/components/simulation/Bouton";
import { ENTREPRISE } from "@/lib/entreprise";
import { envoyerEvenement } from "@/lib/evenements-site";
import { DELAI_REPONSE } from "@/lib/offre-legere";
import { lienWhatsApp } from "@/lib/whatsapp";

/**
 * Après l'envoi des coordonnées (mission 16, partie 4) : « Votre espace est prêt » — le lien de l'espace que le CRM
 * vient d'ouvrir, affiché EN CLAIR (le site ne l'envoie pas : ni mail ni SMS), « Ouvrir mon espace » (le rendu et la
 * simulation y sont), « Copier le lien » ; puis le rappel (« Lucas vous appelle demain à 10 h. ») ou « Nous vous
 * rappelons pour finaliser. ». Sans lien (CRM en secours, trop de projets en cours) : la demande est bien reçue.
 */
export function EspacePret({ lienEspace, phraseRappel, messageWhatsApp, onRecommencer }: { lienEspace: string | null; phraseRappel: string | null; messageWhatsApp: string; onRecommencer: () => void }) {
  const [copie, setCopie] = useState<"" | "ok" | "echec">("");
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lienEspace ?? "");
      setCopie("ok");
    } catch {
      setCopie("echec");
    }
  };

  return (
    <div role="status" className="space-y-4 rounded-[var(--rayon-md)] border border-trait bg-white p-5">
      <h3 className="font-display text-[20px] font-semibold text-encre">{lienEspace ? "Votre espace est prêt" : "Demande bien reçue"}</h3>
      {lienEspace ? (
        <>
          <p className="text-[15px] leading-relaxed text-encre-2">Votre rendu et votre simulation y sont. Gardez ce lien : c&apos;est votre accès.</p>
          <p className="rounded-[var(--rayon-sm)] bg-fond-2 px-3 py-2 text-[14.5px] break-all text-encre">{lienEspace}</p>
          <div className="flex flex-wrap gap-2">
            <a href={lienEspace} className={classesBouton("principal")}>
              Ouvrir mon espace
            </a>
            <Bouton variante="secondaire" onClick={() => void copier()}>
              {copie === "ok" ? "Lien copié" : "Copier le lien"}
            </Bouton>
          </div>
          {copie === "echec" ? <p className="text-[14px] text-encre-2">La copie n&apos;a pas marché : sélectionnez le lien ci-dessus.</p> : null}
        </>
      ) : (
        <p className="text-[15px] leading-relaxed text-encre-2">Votre rendu et vos choix nous sont parvenus. Votre devis suit {DELAI_REPONSE}.</p>
      )}
      <p className="text-[15px] font-medium text-encre">{phraseRappel ?? "Nous vous rappelons pour finaliser."}</p>
      <p className="text-[14px] text-encre-2">
        Une question avant ?{" "}
        <a href={lienWhatsApp(messageWhatsApp)} target="_blank" rel="noopener noreferrer" onClick={() => envoyerEvenement("WHATSAPP_CLIQUE", { depuis: "simulateur-espace" })} className="text-encre underline underline-offset-4">
          WhatsApp
          <span className="sr-only"> (ouvre WhatsApp)</span>
        </a>
        {" · "}
        <a href={`tel:${ENTREPRISE.telephoneInternational}`} className="whitespace-nowrap text-encre underline underline-offset-4">
          {ENTREPRISE.telephone}
        </a>
      </p>
      <Bouton variante="discret" onClick={onRecommencer}>
        Nouvelle simulation
      </Bouton>
    </div>
  );
}
