import type { Metadata } from "next";
import { DELAI_RENDU } from "@/lib/offre";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import BlogClient from "@/components/BlogClient";

export const metadata: Metadata = {
  title: "Guides — prix, durée, entretien, finitions du covering adhésif",
  description:
    "Ce que coûte un covering, combien de temps il tient, comment se passe la pose, quelle finition choisir, comment l'entretenir : des réponses vérifiables, sans jargon.",
  keywords:
    "blog covering adhésif, conseils rénovation, tendances décoration, covering cuisine, covering salle de bain",
  openGraph: {
    title: "Guides CoverSwap — prix, durée, pose, finitions du covering adhésif",
    description:
      "Ce que coûte un covering, combien de temps il tient, comment se passe la pose, quelle finition choisir.",
    url: "https://coverswap.fr/blog",
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
  },
  alternates: {
    canonical: "https://coverswap.fr/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Blog", url: "https://coverswap.fr/blog" }]} />
      <section className="px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <p className="surtitre">Guides</p>
          <h1 className="titre-1 mt-2 max-w-3xl text-encre">Les vraies questions, les vraies réponses</h1>
          <p className="texte mt-4 mb-10 max-w-2xl text-encre-2">
            Ce que coûte un covering, combien de temps il tient, comment se passe la pose, quelle finition choisir, comment l&apos;entretenir.
          </p>

          {/* Îlot client : filtres + grille des guides */}
          <BlogClient />
        </div>
      </section>

      <Section titre="Envie de voir le résultat chez vous ?" intro={`Recevez une simulation gratuite, rendu en ${DELAI_RENDU}.`} fond="fond-2">
        <Lien href="/simulateur">Simuler mon projet</Lien>
      </Section>
    </div>
  );
}
