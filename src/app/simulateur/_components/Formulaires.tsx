"use client";

import CaseConsentement from "@/components/CaseConsentement";

/*
 * Les champs de contact du simulateur (mission 15, partie 4 : thème clair, jetons ; l'indicateur d'étapes est devenu
 * `FilEtapes`). Mission 16 (partie 4) : réduits — prénom et téléphone, e-mail facultatif (exigé seulement pour la
 * demande « par e-mail » après un échec), ville et code postal seulement s'ils ne sont pas déjà connus du parcours,
 * consentement. Plus de message libre : Lucas rappelle.
 */

export type Formulaire = { name: string; phone: string; email: string; ville: string; codePostal: string; consentement: boolean };

export const CHAMP = "min-h-[48px] w-full rounded-[var(--rayon-sm)] border border-trait bg-white px-3.5 py-2.5 text-[16px] text-encre placeholder:text-encre-2/60 focus:border-encre focus:outline-none";
export const FORMULAIRE_VIDE: Formulaire = { name: "", phone: "", email: "", ville: "", codePostal: "", consentement: false };

const ETIQUETTE = "mb-1 block text-[14px] font-medium text-encre";

/** Les champs de contact, communs à la demande après un rendu et à la demande quand la génération a échoué. */
export function ChampsContact({ prefixe, formulaire, onChange, avecVille = true, emailRequis = false }: { prefixe: string; formulaire: Formulaire; onChange: (f: Formulaire) => void; avecVille?: boolean; emailRequis?: boolean }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${prefixe}-nom`} className={ETIQUETTE}>
            Prénom *
          </label>
          <input id={`${prefixe}-nom`} required autoComplete="given-name" value={formulaire.name} onChange={(e) => onChange({ ...formulaire, name: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label htmlFor={`${prefixe}-tel`} className={ETIQUETTE}>
            Téléphone *
          </label>
          <input id={`${prefixe}-tel`} required type="tel" inputMode="tel" autoComplete="tel" value={formulaire.phone} onChange={(e) => onChange({ ...formulaire, phone: e.target.value })} className={CHAMP} />
        </div>
        <div className={avecVille ? "" : "sm:col-span-2"}>
          <label htmlFor={`${prefixe}-email`} className={ETIQUETTE}>
            {emailRequis ? "E-mail *" : <>E-mail <span className="font-normal text-encre-2">(facultatif)</span></>}
          </label>
          <input id={`${prefixe}-email`} required={emailRequis} type="email" autoComplete="email" value={formulaire.email} onChange={(e) => onChange({ ...formulaire, email: e.target.value })} className={CHAMP} />
        </div>
        {avecVille ? (
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <div>
              <label htmlFor={`${prefixe}-ville`} className={ETIQUETTE}>
                Ville *
              </label>
              <input id={`${prefixe}-ville`} required autoComplete="address-level2" value={formulaire.ville} onChange={(e) => onChange({ ...formulaire, ville: e.target.value })} className={CHAMP} />
            </div>
            <div>
              <label htmlFor={`${prefixe}-cp`} className={ETIQUETTE}>
                Code postal *
              </label>
              <input id={`${prefixe}-cp`} required inputMode="numeric" pattern="[0-9]{5}" title="5 chiffres" autoComplete="postal-code" maxLength={5} value={formulaire.codePostal} onChange={(e) => onChange({ ...formulaire, codePostal: e.target.value.replace(/\D/g, "") })} className={CHAMP} />
            </div>
          </div>
        ) : null}
      </div>
      <CaseConsentement id={`consentement-${prefixe}`} checked={formulaire.consentement} onChange={(consentement) => onChange({ ...formulaire, consentement })} clair />
    </>
  );
}
