import { FAQSchema } from "@/components/JsonLd";
import { Section } from "@/components/simulation/Section";
import { FAQ_GENERALE } from "@/data/faq";
import { DELAI_RENDU, DELAI_REPONSE } from "@/lib/offre";

/**
 * « Comment ça se passe » et les questions fréquentes (mission 16, partie 1) :
 * extraits de l'accueil pour être rendus tels quels par `/comment-ca-marche`
 * (page de transition) ; la partie 3 les retire de l'accueil, la partie 5
 * réécrit la page. Composants serveur.
 */
const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white";

export function CommentCaSePasse() {
  const etapes = [
    { titre: "Une photo", texte: `Vous photographiez la pièce ou le meuble. La simulation montre l'effet d'une finition sur votre propre photo, en ${DELAI_RENDU}.` },
    { titre: `Un devis ${DELAI_REPONSE}`, texte: "Chiffré au mètre linéaire, finition par finition, déplacement compris dans le devis. Teintes validées sur échantillons." },
    { titre: "Une journée de pose", texte: "Nettoyage, pose à chaud, finitions vérifiées avec vous. Pas de gravats : vous retrouvez la pièce le soir même." },
  ];
  return (
    <Section large titre="Comment ça se passe">
      <ol className="grid gap-5 md:grid-cols-3">
        {etapes.map((e, i) => (
          <li key={e.titre} className={`${CARTE} p-7`}>
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border border-encre font-display text-[14px] font-semibold text-encre">
              {i + 1}
            </span>
            <h3 className="mt-3 mb-2 text-[17px] font-semibold text-encre">{e.titre}</h3>
            <p className="texte-2">{e.texte}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function QuestionsFrequentes({ fond = "fond" }: { fond?: "fond" | "fond-2" }) {
  return (
    <Section id="faq" titre="Questions fréquentes" fond={fond}>
      <FAQSchema faqs={FAQ_GENERALE} />
      <div className="space-y-2.5">
        {FAQ_GENERALE.map((f) => (
          <details key={f.q} className={`group ${CARTE} p-4`}>
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-encre">
              {f.q}
              <span aria-hidden className="text-2xl leading-none text-encre-2 transition-transform duration-[var(--duree-courte)] group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="texte-2 mt-3">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
