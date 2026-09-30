import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import Realisations from "@/components/Realisations";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE } from "@/lib/offre";

export const metadata: Metadata = {
  title: { absolute: "Réalisations et avis — covering adhésif à Montpellier | CoverSwap" },
  description: "Cuisines, salles de bain, meubles et locaux recouverts d'un film Cover Styl' : photos après chantier publiées avec l'accord des clients, et leurs avis.",
  alternates: { canonical: `${ENTREPRISE.site}/realisations` },
};

export const revalidate = 300;

export default function PageRealisations() {
  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Réalisations", url: `${ENTREPRISE.site}/realisations` }]} />
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Réalisations" }]} />
          <h1 className="titre-1 max-w-3xl text-encre">Ce que ça donne, chez de vrais clients</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">Photos prises à la fin des chantiers, publiées avec l&apos;accord des personnes. Pas d&apos;image de catalogue présentée comme une pose.</p>
        </div>
      </section>
      <Realisations />
      <Section titre="Et chez vous ?" intro={`Simulez le rendu sur votre propre photo, ou envoyez vos photos pour un devis ${DELAI_REPONSE}.`} fond="fond-2">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Lien href="/simulateur">Simuler sur ma photo</Lien>
          <Lien href="/devis" variante="secondaire">
            Demander un devis
          </Lien>
        </div>
      </Section>
    </div>
  );
}
