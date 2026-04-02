import type { Metadata } from "next";
import Link from "next/link";
import RealisationsClient from "@/components/RealisationsClient";

export const metadata: Metadata = {
  title: "Nos réalisations | CoverSwap — Avant/Après covering adhésif",
  description:
    "Découvrez nos transformations avant/après en covering adhésif. Cuisines, salles de bain, meubles et espaces professionnels transformés en 1 journée.",
  keywords:
    "réalisations covering, avant après rénovation, covering cuisine avant après, transformation intérieure, covering adhésif résultats",
  openGraph: {
    title: "Nos réalisations — CoverSwap",
    description:
      "Découvrez nos transformations avant/après en covering adhésif. Cuisines, salles de bain, meubles et espaces professionnels.",
    url: "https://coverswap.fr/realisations",
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
  },
  alternates: {
    canonical: "https://coverswap.fr/realisations",
  },
};

export default function RealisationsPage() {
  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="text-rouge font-bold text-sm uppercase tracking-widest">Portfolio</span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-3 mb-4">
            Nos <span className="text-rouge">réalisations</span>
          </h1>
          <p className="text-gris-400 max-w-2xl mx-auto text-lg">
            Découvrez nos transformations. Glissez pour comparer l&apos;avant et l&apos;après.
          </p>
        </div>

        {/* Client island: filters + project grid */}
        <RealisationsClient />

        <div className="text-center mt-16 space-y-6">
          <Link href="/simulation" className="btn-primary">
            Simuler votre projet gratuitement
          </Link>
          <div>
            <Link
              href="/revetements"
              className="inline-flex items-center gap-2 text-gris-400 hover:text-rouge transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Parcourir nos 497 references Cover Styl&apos;
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
