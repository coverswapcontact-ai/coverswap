import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | CoverSwap — Devis gratuit covering adhésif",
  description:
    "Contactez CoverSwap pour un devis gratuit de covering adhésif. Rénovation cuisine, salle de bain, meubles et locaux pro. Réponse sous 24h.",
  keywords:
    "contact coverswap, devis covering, demande devis rénovation adhésive, covering montpellier contact",
  alternates: {
    canonical: "https://coverswap.fr/contact",
  },
  openGraph: {
    title: "Contact CoverSwap — Devis gratuit covering adhésif",
    description:
      "Contactez-nous pour un devis gratuit de covering adhésif. Réponse sous 24h.",
    url: "https://coverswap.fr/contact",
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
