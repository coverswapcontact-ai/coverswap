import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { LocalBusinessSchema, OrganizationSchema } from "@/components/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CoverSwap | Rénovation intérieure par revêtements adhésifs texturés",
  description:
    "Transformez votre intérieur en 1 journée avec nos revêtements adhésifs haut de gamme. Simulation IA gratuite en 60 secondes. Cuisine, salle de bain, meubles — 10x moins cher qu'une rénovation classique.",
  keywords:
    "covering adhésif, rénovation intérieure, revêtement adhésif, covering cuisine, covering salle de bain, covering meubles, covering professionnel, simulation IA",
  openGraph: {
    title: "CoverSwap | Rénovation intérieure premium par covering adhésif",
    description:
      "Transformez votre intérieur en 1 journée. Simulation IA gratuite en 60 secondes.",
    url: "https://coverswap.fr",
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <LocalBusinessSchema />
        <OrganizationSchema />
        <Header />
        <div id="main-content" />
        <main>{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
