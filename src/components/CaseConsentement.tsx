"use client";

import Link from "next/link";
import { TEXTE_CONSENTEMENT_MAIL } from "@/lib/consentement";

/**
 * Case de consentement aux e-mails commerciaux : distincte de l'envoi du
 * formulaire, jamais pré-cochée, facultative. Sous la case, la mention
 * d'information RGPD obligatoire.
 */
export default function CaseConsentement({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
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
          className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-white/5 accent-rouge"
        />
        <span className="text-sm text-gris-300 leading-relaxed">{TEXTE_CONSENTEMENT_MAIL}</span>
      </label>
      <p className="text-xs text-gris-500 leading-relaxed">
        Vos coordonnées et vos photos servent uniquement à traiter votre demande (devis, simulation, rappel). Elles sont
        conservées 3 ans et ne sont jamais vendues. Vous pouvez accéder à vos données, les rectifier, les effacer ou vous
        opposer à leur usage en écrivant à contact@coverswap.fr.{" "}
        <Link href="/politique-confidentialite" className="underline hover:text-white transition-colors">
          Politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
