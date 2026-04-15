import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/JsonLd";
import BlogClient from "@/components/BlogClient";

export const metadata: Metadata = {
  title: "Blog | CoverSwap — Conseils et tendances covering adhésif",
  description:
    "Conseils, tendances et guides pratiques autour du covering adhésif et de la rénovation intérieure. Découvrez nos articles experts.",
  keywords:
    "blog covering adhésif, conseils rénovation, tendances décoration, covering cuisine, covering salle de bain",
  openGraph: {
    title: "Blog CoverSwap — Conseils et tendances covering adhésif",
    description:
      "Conseils, tendances et guides pratiques autour du covering adhésif et de la rénovation intérieure.",
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
    <div className="min-h-screen pt-28 pb-20">
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Blog", url: "https://coverswap.fr/blog" }]} />
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-rouge font-bold text-sm uppercase tracking-widest">
            Blog
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 mb-4">
            Nos <span className="text-rouge">articles</span>
          </h1>
          <p className="text-gris-400 max-w-2xl mx-auto text-lg">
            Conseils, tendances et guides pratiques autour du covering adhesif et
            de la renovation interieure.
          </p>
        </div>

        {/* Client island: filters + articles grid */}
        <BlogClient />

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="glass-card inline-block px-10 py-8">
            <p className="font-display text-xl font-bold mb-2">
              Envie de voir le résultat sur votre cuisine ?
            </p>
            <p className="text-gris-400 mb-6 text-sm">
              Recevez une simulation gratuite en 60 secondes.
            </p>
            <Link href="/simulation" className="btn-primary">
              Simuler ma cuisine
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
