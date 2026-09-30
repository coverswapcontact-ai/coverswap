"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BoutonWhatsApp } from "@/components/accueil/BoutonWhatsApp";
import { Bouton } from "@/components/simulation/Bouton";
import { ENTREPRISE } from "@/lib/entreprise";
import { estimationCalculable, estimer, FAMILLE_DU_PROJET, formatsDeLaFamille, type Estimation as ValeurEstimation } from "@/lib/estimation";
import { DELAI_REPONSE } from "@/lib/offre-legere";
import type { CreneauRappel } from "@/lib/rappel";
import type { ExtraDemande } from "@/lib/simulateur/demande";
import type { RenduSimulateur } from "@/lib/simulateur/reprise";
import type { TarifsSite } from "@/lib/tarifs-site";
import { messageWhatsAppSimulation } from "@/lib/whatsapp";
import { EspacePret } from "./EspacePret";
import { Estimation } from "./Estimation";
import { ChampsContact, type Formulaire } from "./Formulaires";
import { Rappel } from "./Rappel";

export type DemandeEnvoyee = { lienEspace: string | null; phraseRappel: string | null };

/**
 * La fin de l'écran Résultat (mission 16, partie 4), sous les films : l'estimation (« Quelle taille ? » puis la
 * fourchette), les coordonnées réduites (prénom, téléphone, e-mail facultatif, ville seulement si inconnue,
 * consentement), « Être rappelé » (facultatif), UN bouton principal « Recevoir mon devis », WhatsApp en secondaire
 * avec un message qui cite la simulation. Après l'envoi : « Votre espace est prêt » (`EspacePret`). Le simulateur
 * garde l'envoi (`onEnvoyer`) : cette partie ne parle pas au réseau.
 */
export function DemandeApresRendu(props: {
  projet: string;
  rendu: RenduSimulateur;
  tarifs: TarifsSite | null;
  formulaire: Formulaire;
  onFormulaire: (f: Formulaire) => void;
  avecVille: boolean;
  occupe: boolean;
  envoye: DemandeEnvoyee | null;
  onEnvoyer: (extra: ExtraDemande) => void;
  /** Appelé à chaque estimation affichée ; le simulateur n'émet ESTIMATION_VUE qu'une fois par simulation (« Nouvelle simulation » la réarme). */
  onEstimationVue: (meta: { format: string; min: number; max: number; type: ValeurEstimation["type"] }) => void;
  captcha: ReactNode;
  onRecommencer: () => void;
}) {
  const { projet, rendu, tarifs, envoye } = props;
  const [format, setFormat] = useState<string | null>(null);
  const [creneau, setCreneau] = useState<CreneauRappel | null>(null);
  const famille = FAMILLE_DU_PROJET[projet] ?? null;
  const zones = rendu.references.map((r) => r.zone);
  // « Quelle taille ? » seulement si la taille change le chiffre (zones chiffrables au mètre linéaire, prix connus) :
  // sinon, la fourchette de la pièce (ou « sur devis ») tout de suite, sans geste pour rien.
  const formats = estimationCalculable({ famille, tarifs, zonesChoisies: zones }) ? formatsDeLaFamille(famille, tarifs) : [];
  // Avec des formats, rien avant le choix ; sans format, la fourchette de la pièce (ou « sur devis ») tout de suite.
  const estimation = formats.length === 0 || format ? estimer({ famille, format, tarifs, zonesChoisies: zones }) : null;
  const cle = estimation ? `${estimation.type}:${format ?? ""}:${"min" in estimation ? estimation.min : 0}:${"max" in estimation ? (estimation.max ?? 0) : 0}` : null;

  useEffect(() => {
    if (!estimation) return;
    props.onEstimationVue({ format: format ?? "aucun", min: "min" in estimation ? estimation.min : 0, max: "max" in estimation ? (estimation.max ?? 0) : 0, type: estimation.type });
    // Une fois par estimation affichée (le simulateur filtre à une par parcours).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  if (envoye) {
    return <EspacePret lienEspace={envoye.lienEspace} phraseRappel={envoye.phraseRappel} messageWhatsApp={messageWhatsAppSimulation(projet, rendu.references)} onRecommencer={props.onRecommencer} />;
  }

  return (
    <div className="space-y-6">
      <Estimation famille={famille} formats={formats} format={format} onFormat={setFormat} estimation={estimation} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          props.onEnvoyer({ estimation, rappelCreneau: creneau });
        }}
        className="space-y-5 rounded-[var(--rayon-md)] border border-trait bg-white p-4 sm:p-5"
      >
        <div>
          <h3 className="font-display text-[20px] font-semibold text-encre">Recevoir mon devis</h3>
          <p className="text-[14.5px] leading-relaxed text-encre-2">Gratuit, {DELAI_REPONSE}, sans engagement. Votre espace s&apos;ouvre avec ce rendu.</p>
        </div>
        <ChampsContact prefixe="sim" formulaire={props.formulaire} onChange={props.onFormulaire} avecVille={props.avecVille} />
        <Rappel choisi={creneau} onChoisir={setCreneau} />
        {props.captcha}
        <Bouton type="submit" plein occupe={props.occupe} libelleOccupe="Envoi…">
          Recevoir mon devis
        </Bouton>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <BoutonWhatsApp depuis="simulateur-resultat" message={messageWhatsAppSimulation(projet, rendu.references)} />
          <a href={`tel:${ENTREPRISE.telephoneInternational}`} className="inline-flex min-h-[44px] items-center text-[14.5px] whitespace-nowrap text-encre-2 underline underline-offset-4 hover:text-encre">
            {ENTREPRISE.telephone}
          </a>
        </div>
      </form>
    </div>
  );
}
