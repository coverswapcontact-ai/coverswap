import { Section } from "@/components/simulation/Section";
import { DUREE_POSE_TEXTE } from "@/lib/offre";

/**
 * 3. Trois faits (mission 16, partie 3) : trois colonnes de texte, sans icône.
 * C'est ICI, et nulle part ailleurs sur l'accueil, que le covering et le film
 * adhésif sont expliqués (une phrase). La durée vient d'`offre.ts`.
 */
export const PHRASE_COVERING = "Le covering, c'est un film adhésif haute résistance appliqué sur vos surfaces.";

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

export const TROIS_FAITS: readonly { titre: string; texte: string }[] = [
  { titre: majuscule(DUREE_POSE_TEXTE), texte: `La pose d'une cuisine se fait en ${DUREE_POSE_TEXTE}.` },
  { titre: "Sans travaux", texte: "Aucune démolition, aucune poussière : le film se pose sur vos meubles." },
  { titre: "Réversible", texte: "Le film se retire sans abîmer le support." },
];

export function TroisFaits() {
  return (
    <Section large differee>
      <p className="texte max-w-2xl text-encre">{PHRASE_COVERING}</p>
      <dl className="mt-8 grid gap-6 md:mt-10 md:grid-cols-3 md:gap-10">
        {TROIS_FAITS.map((fait) => (
          <div key={fait.titre} className="border-t border-trait pt-4">
            <dt className="text-[17px] font-semibold text-encre">{fait.titre}</dt>
            <dd className="texte-2 mt-1">{fait.texte}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
