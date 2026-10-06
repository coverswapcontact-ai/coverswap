import { FAQSchema } from "@/components/JsonLd";
import { Section } from "@/components/simulation/Section";
import { QUESTIONS_ACCUEIL } from "@/data/faq";
import { DernierAppel } from "./DernierAppel";

/**
 * 9. Questions avant de se lancer, puis le dernier appel (site 3.0, lot B6 ; énoncé, § C.1) : six questions de la FAQ
 * (`QUESTIONS_ACCUEIL`, une seule source), repliées (`<details>`, sans JavaScript), entre des filets d'encre, avec leur
 * balisage `FAQPage` — un seul sur la page. Puis le dernier appel, en encre. Composant serveur.
 */
export function QuestionsAccueil() {
  return (
    <>
      <FAQSchema faqs={QUESTIONS_ACCUEIL} />
      <Section id="questions" large differee ton="papier-2" titre="Questions avant de se lancer">
        <div className="max-w-3xl border-b border-encre">
          {QUESTIONS_ACCUEIL.map((f) => (
            <details key={f.q} className="group border-t border-encre">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-encre [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="font-display text-[26px] leading-none font-normal transition-transform duration-[var(--duree-courte)] group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="texte-2 pb-5">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
      <DernierAppel />
    </>
  );
}
