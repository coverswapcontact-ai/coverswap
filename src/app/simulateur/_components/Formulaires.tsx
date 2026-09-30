"use client";

import CaseConsentement from "@/components/CaseConsentement";

/* Extraction pure de Simulateur.tsx (mission 15, partie 1) : l'indicateur d'étapes et les champs de contact. */

export type Etape = 1 | 2 | 3;
export type Formulaire = { name: string; phone: string; email: string; ville: string; codePostal: string; message: string; consentement: boolean };

export const CHAMP = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-hidden focus:border-rouge/50";
export const FORMULAIRE_VIDE: Formulaire = { name: "", phone: "", email: "", ville: "", codePostal: "", message: "", consentement: false };

/** `verrou` : la raison pour laquelle on ne revient pas en arrière (génération en cours) ; les étapes faites restent visibles, pas cliquables. */
export function Indicateur({ etape, onRetour, verrou }: { etape: Etape; onRetour: (e: Etape) => void; verrou?: string | null }) {
  const libelles = ["Photo", "Revêtement", "Résultat"];
  return (
    <ol className="flex items-center gap-2 sm:gap-4 mb-8" aria-label="Progression">
      {libelles.map((l, i) => {
        const n = (i + 1) as Etape;
        const faite = n < etape;
        const courante = n === etape;
        return (
          <li key={l} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!faite || !!verrou}
              title={faite && verrou ? verrou : undefined}
              onClick={() => onRetour(n)}
              aria-current={courante ? "step" : undefined}
              className={`flex items-center gap-2 text-sm ${courante ? "text-white" : faite ? "text-gris-300 hover:text-white" : "text-gris-600"} disabled:cursor-default`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${courante ? "bg-rouge text-white" : faite ? "bg-green-600/80 text-white" : "bg-white/10"}`}>{faite ? "✓" : n}</span>
              <span className="hidden sm:inline">{l}</span>
            </button>
            {i < libelles.length - 1 ? <span aria-hidden className="w-6 sm:w-10 h-px bg-white/15" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Les champs de contact, communs à la demande après un rendu et à la demande quand la génération a échoué. */
export function ChampsContact({ prefixe, formulaire, onChange }: { prefixe: string; formulaire: Formulaire; onChange: (f: Formulaire) => void }) {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${prefixe}-nom`} className="block text-sm mb-1">
            Nom complet *
          </label>
          <input id={`${prefixe}-nom`} required autoComplete="name" value={formulaire.name} onChange={(e) => onChange({ ...formulaire, name: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label htmlFor={`${prefixe}-tel`} className="block text-sm mb-1">
            Téléphone *
          </label>
          <input id={`${prefixe}-tel`} required type="tel" inputMode="tel" autoComplete="tel" value={formulaire.phone} onChange={(e) => onChange({ ...formulaire, phone: e.target.value })} className={CHAMP} />
        </div>
        <div>
          <label htmlFor={`${prefixe}-email`} className="block text-sm mb-1">
            E-mail *
          </label>
          <input id={`${prefixe}-email`} required type="email" autoComplete="email" value={formulaire.email} onChange={(e) => onChange({ ...formulaire, email: e.target.value })} className={CHAMP} />
        </div>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <div>
            <label htmlFor={`${prefixe}-ville`} className="block text-sm mb-1">
              Ville *
            </label>
            <input id={`${prefixe}-ville`} required autoComplete="address-level2" value={formulaire.ville} onChange={(e) => onChange({ ...formulaire, ville: e.target.value })} className={CHAMP} />
          </div>
          <div>
            <label htmlFor={`${prefixe}-cp`} className="block text-sm mb-1">
              Code postal *
            </label>
            <input id={`${prefixe}-cp`} required inputMode="numeric" pattern="[0-9]{5}" title="5 chiffres" autoComplete="postal-code" maxLength={5} value={formulaire.codePostal} onChange={(e) => onChange({ ...formulaire, codePostal: e.target.value.replace(/\D/g, "") })} className={CHAMP} />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor={`${prefixe}-message`} className="block text-sm mb-1">
          Un mot sur votre projet (facultatif)
        </label>
        <textarea id={`${prefixe}-message`} rows={2} value={formulaire.message} onChange={(e) => onChange({ ...formulaire, message: e.target.value })} className={`${CHAMP} resize-none`} />
      </div>
      <CaseConsentement id={`consentement-${prefixe}`} checked={formulaire.consentement} onChange={(consentement) => onChange({ ...formulaire, consentement })} />
    </>
  );
}
