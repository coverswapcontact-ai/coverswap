"use client";

import { useId, useState } from "react";
import { CHAMP } from "@/app/simulateur/_components/Formulaires";
import CaseConsentement from "@/components/CaseConsentement";
import { Bouton } from "@/components/simulation/Bouton";
import { Feuille } from "@/components/simulation/Feuille";
import Turnstile, { reinitialiserTurnstile } from "@/components/Turnstile";
import { consentementPourEnvoi } from "@/lib/consentement";
import { envoyerEvenement } from "@/lib/evenements-site";
import { obtenirParcoursId } from "@/lib/parcours";
import { phraseRappel, rappelDuCreneau, type CreneauRappel, type OptionRappel } from "@/lib/rappel";
import { acquisitionPourEnvoi } from "@/lib/utm";
import { FORMULAIRE_RAPPEL } from "./FormulaireRappel";

/**
 * La feuille « Être rappelé » (site 3.0, lot B6 ; séparée du bouton au lot F7) : prénom, téléphone, un créneau (« Ce
 * soir 18 h », « Demain 10 h »… en heure de Paris, `lib/rappel`, calculés par le bouton à chaque ouverture), le
 * consentement aux e-mails (facultatif, jamais pré-coché), le captcha au premier geste, un pot de miel. Envoi à
 * `/api/contact` (`formulaire: "coverswap.fr/rappel"`, source `SITE_CONTACT`, `rappelCreneau` : le CRM date le
 * rappel). Événements : `CONTACT_ENVOYE` et `RAPPEL_DEMANDE` (`creneau`, `depuis`), `FORMULAIRE_ECHEC` en cas d'échec.
 * Feuille ouverte : le bouton collé de l'accueil s'efface (`data-feuille-ouverte`).
 *
 * Chargée par `FormulaireRappel` au premier geste vers le bouton (survol, focus, toucher, au plus tard le clic), puis
 * gardée : ses réponses et sa confirmation restent d'une ouverture à l'autre, comme avant.
 */
const ETIQUETTE = "mb-1 block text-[14px] font-medium text-encre";

export function FeuilleRappel({ depuis, ouverte, onFermer, options }: { depuis: string; ouverte: boolean; onFermer: () => void; options: OptionRappel[] }) {
  const id = useId();
  // Le premier créneau proposé par défaut ; un créneau choisi reste choisi d'une ouverture à l'autre.
  const [choix, setCreneau] = useState<CreneauRappel | null>(null);
  const creneau = choix ?? options[0]?.code ?? null;
  const [consentement, setConsentement] = useState(false);
  const [jeton, setJeton] = useState<string | null>(null);
  const [touche, setTouche] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const idFormulaire = `rappel-${id.replace(/[^a-zA-Z0-9-]/g, "")}`;

  const toucher = () => setTouche(true);

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!creneau) return;
    setEnvoi(true);
    setErreur("");
    const formulaire = e.currentTarget;
    const champ = (nom: string) => String(new FormData(formulaire).get(nom) ?? "").trim();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: champ("prenom"),
          phone: champ("telephone"),
          website: champ("website"),
          rappelCreneau: creneau,
          source: FORMULAIRE_RAPPEL,
          formulaire: FORMULAIRE_RAPPEL,
          parcoursId: obtenirParcoursId(),
          turnstileToken: jeton,
          ...acquisitionPourEnvoi(),
          ...consentementPourEnvoi(consentement, "rappel"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErreur(`${d?.error || "Une erreur est survenue."} Vos réponses sont conservées : vous pouvez réessayer.`);
        envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: "rappel", statut: res.status, raison: d?.reason });
        return;
      }
      envoyerEvenement("CONTACT_ENVOYE", { formulaire: "rappel", depuis });
      envoyerEvenement("RAPPEL_DEMANDE", { creneau, depuis });
      const maintenant = new Date();
      setConfirmation(phraseRappel(rappelDuCreneau(creneau, maintenant), maintenant));
      formulaire.reset();
      setConsentement(false);
    } catch {
      setErreur("Connexion interrompue. Vos réponses sont conservées : réessayez.");
      envoyerEvenement("FORMULAIRE_ECHEC", { formulaire: "rappel", raison: "reseau" });
    } finally {
      setEnvoi(false);
      reinitialiserTurnstile();
      setJeton(null);
    }
  }

  return (
    <Feuille
        ouverte={ouverte}
        onFermer={onFermer}
        titre="Être rappelé"
        sousTitre={confirmation ? undefined : "Votre prénom, votre numéro, un moment : Lucas vous appelle. Gratuit, sans engagement."}
        pied={
          confirmation ? null : (
            <Bouton type="submit" form={idFormulaire} plein occupe={envoi} libelleOccupe="Envoi en cours…" raisonDesactive={creneau ? null : "Choisissez un moment"}>
              Être rappelé
            </Bouton>
          )
        }
      >
        {confirmation ? (
          <div role="status" className="space-y-2 pt-2">
            <p className="text-[17px] font-semibold text-encre">C&apos;est noté.</p>
            <p className="texte-2">{confirmation}</p>
          </div>
        ) : (
          <form id={idFormulaire} onSubmit={envoyer} onFocusCapture={toucher} onPointerDownCapture={toucher} className="space-y-5 pt-2">
            <div>
              <label htmlFor={`${idFormulaire}-prenom`} className={ETIQUETTE}>
                Prénom *
              </label>
              <input id={`${idFormulaire}-prenom`} name="prenom" required autoComplete="given-name" className={CHAMP} />
            </div>
            <div>
              <label htmlFor={`${idFormulaire}-telephone`} className={ETIQUETTE}>
                Téléphone *
              </label>
              <input id={`${idFormulaire}-telephone`} name="telephone" type="tel" inputMode="tel" required autoComplete="tel" className={CHAMP} />
            </div>
            <fieldset>
              <legend className={ETIQUETTE}>Quand vous appeler ?</legend>
              <div className="flex flex-wrap gap-2">
                {options.map((o) => (
                  <button
                    key={o.code}
                    type="button"
                    aria-pressed={creneau === o.code}
                    onClick={() => setCreneau(o.code)}
                    className={`min-h-[44px] rounded-[var(--rayon-sm)] border px-4 text-[15px] font-medium transition-colors duration-[var(--duree-courte)] ${creneau === o.code ? "border-encre bg-encre text-blanc" : "border-trait bg-white text-encre hover:border-encre"}`}
                  >
                    {o.libelle}
                  </button>
                ))}
              </div>
            </fieldset>
            <CaseConsentement id={`${idFormulaire}-consentement`} checked={consentement} onChange={setConsentement} />
            {/* Pot de miel : invisible pour une personne. */}
            <div className="absolute overflow-hidden" style={{ width: 0, height: 0, opacity: 0, position: "absolute", top: "-9999px", left: "-9999px" }} aria-hidden="true" tabIndex={-1}>
              <label htmlFor={`${idFormulaire}-website`}>Website</label>
              <input type="text" id={`${idFormulaire}-website`} name="website" autoComplete="off" tabIndex={-1} />
            </div>
            <Turnstile action="rappel" theme="light" onToken={setJeton} actif={touche} />
            {erreur ? (
              <p role="alert" className="rounded-[var(--rayon-sm)] bg-alerte-fond px-4 py-3 text-[14.5px] text-alerte-texte">
                {erreur}
              </p>
            ) : null}
          </form>
        )}
    </Feuille>
  );
}
