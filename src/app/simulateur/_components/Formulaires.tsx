"use client";

import CaseConsentement from "@/components/CaseConsentement";

/* Les champs de contact du simulateur (mission 15, partie 4 : thème clair, jetons ; l'indicateur d'étapes est devenu `FilEtapes`). */

export type Formulaire = { name: string; phone: string; email: string; ville: string; codePostal: string; message: string; consentement: boolean };

export const CHAMP = "min-h-[48px] w-full rounded-[var(--rayon-sm)] border border-trait bg-white px-3.5 py-2.5 text-[16px] text-encre placeholder:text-encre-2/60 focus:border-encre focus:outline-none";
export const FORMULAIRE_VIDE: Formulaire = { name: "", phone: "", email: "", ville: "", codePostal: "", message: "", consentement: false };

const ETIQUETTE = "mb-1 block text-[14px] font-medium text-encre";

/** Les champs de contact, communs à la demande après un rendu et à la demande quand la génération a échoué. */
export function ChampsContact({ prefixe, formulaire, onChange }: { prefixe: string; formulaire: Formulaire; onChange: (f: Formulaire) => void }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${prefixe}-nom`} className={ETIQUETTE}>
            Nom complet *
          </label>
          <input id={`${prefixe}-nom`} required autoComplete="name" value={formulaire.name} onChange={(e) => onChange({ ...formulaire, name: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label htmlFor={`${prefixe}-tel`} className={ETIQUETTE}>
            Téléphone *
          </label>
          <input id={`${prefixe}-tel`} required type="tel" inputMode="tel" autoComplete="tel" value={formulaire.phone} onChange={(e) => onChange({ ...formulaire, phone: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label htmlFor={`${prefixe}-email`} className={ETIQUETTE}>
            E-mail *
          </label>
          <input id={`${prefixe}-email`} required type="email" autoComplete="email" value={formulaire.email} onChange={(e) => onChange({ ...formulaire, email: e.target.value })} className={CHAMP} />
        </div>
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
      </div>
      <div>
        <label htmlFor={`${prefixe}-message`} className={ETIQUETTE}>
          Un mot sur votre projet (facultatif)
        </label>
        <textarea id={`${prefixe}-message`} rows={2} value={formulaire.message} onChange={(e) => onChange({ ...formulaire, message: e.target.value })} className={`${CHAMP} resize-none`} />
      </div>
      <CaseConsentement id={`consentement-${prefixe}`} checked={formulaire.consentement} onChange={(consentement) => onChange({ ...formulaire, consentement })} clair />
    </>
  );
}
