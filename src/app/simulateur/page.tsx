import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { BreadcrumbSchema, FAQSchema, HowToSchema } from "@/components/JsonLd";
import { FAQ_SIMULATEUR } from "@/data/faq";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, NB_REFERENCES } from "@/lib/offre";
import Simulateur from "./_components/Simulateur";

export const metadata: Metadata = {
  title: { absolute: "Simulateur de covering sur votre photo — gratuit, sans inscription | CoverSwap" },
  description: `Envoyez une photo de votre cuisine, salle de bain, meuble ou local, choisissez une finition parmi ${NB_REFERENCES} références Cover Styl', voyez le résultat en moins d'une minute. Coordonnées demandées seulement pour recevoir le rendu et un devis ${DELAI_REPONSE}.`,
  alternates: { canonical: `${ENTREPRISE.site}/simulateur` },
};

const ETAPES = [
  { titre: "Photographier la pièce", texte: "Une photo de face, bien éclairée, de la cuisine, de la salle de bain, du meuble ou du local. Téléphone ou ordinateur." },
  { titre: "Choisir les surfaces et la finition", texte: `Crédence, plan de travail, façades… et pour chacune une finition parmi ${NB_REFERENCES} références Cover Styl'.` },
  { titre: "Voir le résultat", texte: "Le rendu s'affiche en avant / après en moins d'une minute. Vos coordonnées ne sont demandées que pour le recevoir avec un devis." },
];

export default function PageSimulateur() {
  return (
    <main className="bg-noir min-h-screen">
      <HowToSchema name="Simuler un covering sur sa propre photo" description="Trois étapes, sans inscription." etapes={ETAPES} dureeTotale="PT2M" />
      <FAQSchema faqs={FAQ_SIMULATEUR} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Simulateur", url: `${ENTREPRISE.site}/simulateur` }]} />
      <div className="container-custom px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-20">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Simulateur" }]} />
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3 text-balance">Votre pièce, avec le revêtement de votre choix</h1>
        <p className="text-gris-300 text-lg max-w-2xl mb-8">Une photo, une finition, un résultat en moins d&apos;une minute. Gratuit, sans inscription : vos coordonnées ne servent qu&apos;à recevoir le rendu et un devis.</p>
        <div className="glass-card p-5 sm:p-8">
          <Simulateur />
        </div>
        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-2xl font-bold mb-6">Comment ça marche</h2>
          <ol className="space-y-4">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-rouge/15 border border-rouge/40 flex items-center justify-center shrink-0 font-display font-bold text-rouge text-sm">{i + 1}</span>
                <div>
                  <p className="font-display font-bold">{e.titre}</p>
                  <p className="text-gris-400 text-sm leading-relaxed">{e.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-2xl font-bold mb-6">Questions sur le simulateur</h2>
          <div className="space-y-3">
            {FAQ_SIMULATEUR.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer font-display font-bold list-none">
                  {f.q}
                  <span aria-hidden className="text-rouge transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
                </summary>
                <p className="text-gris-400 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
