import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulation IA | CoverSwap — Visualisez le rendu en 60 secondes",
  description:
    "Simulez gratuitement le rendu du covering adhésif sur votre projet (cuisine, salle de bain, meubles) grâce à notre IA. Résultat photoréaliste en 60 secondes.",
  keywords:
    "simulation covering, simulation IA rénovation, aperçu covering adhésif, visualisation cuisine, simulation salle de bain",
  alternates: {
    canonical: "https://coverswap.fr/simulation",
  },
  openGraph: {
    title: "Simulation IA covering — CoverSwap",
    description:
      "Visualisez le rendu du covering adhésif sur votre projet en 60 secondes grâce à notre IA.",
    url: "https://coverswap.fr/simulation",
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
  },
};

export default function SimulationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
