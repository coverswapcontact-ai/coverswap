"use client";

import Link from "next/link";
import { TEXTE_CONSENTEMENT_MAIL } from "@/lib/consentement";

/**
 * Case de consentement aux e-mails commerciaux : distincte de l'envoi du
 * formulaire, jamais pré-cochée, facultative. Sous la case, la mention
 * d'information RGPD obligatoire. `clair` : sur fond clair (simulateur,
 * mission 15), les textes prennent l'encre du thème.
 */
export default function CaseConsentement({
  id,
  checked,
  onChange,
  clair = false,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  clair?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
        <input
          id={id}
          name="consentement_mail"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={clair ? "mt-1 h-4 w-4 shrink-0 rounded border-trait accent-[var(--color-encre)]" : "mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-white/5 accent-rouge"}
        />
        <span className={clair ? "text-[14px] leading-relaxed text-encre" : "text-sm text-gris-300 leading-relaxed"}>{TEXTE_CONSENTEMENT_MAIL}</span>
      </label>
      <p className={clair ? "text-[13px] leading-relaxed text-encre-2" : "text-xs text-gris-500 leading-relaxed"}>
        Vos coordonnées et vos photos servent uniquement à traiter votre demande (devis, simulation, rappel). Elles sont
        conservées 3 ans et ne sont jamais vendues. Vous pouvez accéder à vos données, les rectifier, les effacer ou vous
        opposer à leur usage en écrivant à contact@coverswap.fr.{" "}
        <Link href="/politique-confidentialite" className={clair ? "underline hover:text-encre" : "underline hover:text-white transition-colors"}>
          Politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
