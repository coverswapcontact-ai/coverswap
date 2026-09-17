import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import Realisations from "@/components/Realisations";
import { BreadcrumbSchema } from "@/components/JsonLd";
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
    <main className="bg-noir min-h-screen">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Réalisations", url: `${ENTREPRISE.site}/realisations` }]} />
      <section className="pt-32 pb-10 md:pt-40 px-4 sm:px-6 lg:px-8">
        <div className="container-custom">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Réalisations" }]} />
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 max-w-3xl text-balance">Ce que ça donne, chez de vrais clients</h1>
          <p className="text-gris-300 text-lg max-w-2xl leading-relaxed">Photos prises à la fin des chantiers, publiées avec l&apos;accord des personnes. Pas d&apos;image de catalogue présentée comme une pose.</p>
        </div>
      </section>
      <Realisations />
      <section className="section-padding pt-0">
        <div className="container-custom rounded-3xl bg-rouge/10 border border-rouge/30 p-8 md:p-12 text-center">
          <h2 className="font-display text-3xl font-bold mb-3">Et chez vous ?</h2>
          <p className="text-gris-300 max-w-xl mx-auto mb-6">Simulez le rendu sur votre propre photo, ou envoyez vos photos pour un devis {DELAI_REPONSE}.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/simulateur" className="btn-primary">
              Simuler sur ma photo
            </Link>
            <Link href="/devis" className="btn-secondary">
              Demander un devis
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
