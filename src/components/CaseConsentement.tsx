"use client";

import Link from "next/link";
import { TEXTE_CONSENTEMENT_MAIL } from "@/lib/consentement";

/**
 * Case de consentement aux e-mails commerciaux : distincte de l'envoi du
 * formulaire, jamais pré-cochée, facultative. Sous la case, la mention
 * d'information RGPD obligatoire. Mission 16 : le site entier est clair ;
 * `clair` (simulateur, mission 15) reste accepté et ne change plus rien.
 */
export default function CaseConsentement({
  id,
  checked,
  onChange,
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
          className="mt-1 h-4 w-4 shrink-0 rounded border-trait accent-[var(--color-encre)]"
        />
        <span className="text-[14px] leading-relaxed text-encre">{TEXTE_CONSENTEMENT_MAIL}</span>
      </label>
      <p className="text-[13px] leading-relaxed text-encre-2">
        Vos coordonnées et vos photos servent uniquement à traiter votre demande (devis, simulation, rappel). Elles sont
        conservées 3 ans et ne sont jamais vendues. Vous pouvez accéder à vos données, les rectifier, les effacer ou vous
        opposer à leur usage en écrivant à contact@coverswap.fr.{" "}
        <Link href="/politique-confidentialite" className="underline hover:text-encre">
          Politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
