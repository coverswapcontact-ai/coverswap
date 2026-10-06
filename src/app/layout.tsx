import type { Metadata, Viewport } from "next";
import { Libre_Franklin, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import EnteteSite from "@/components/EnteteSite";
import PiedDePage from "@/components/PiedDePage";
import ScrollToTop from "@/components/ScrollToTop";
import SuiviParcours from "@/components/SuiviParcours";
import HorsEspaceClient from "@/components/HorsEspaceClient";
import HorsSimulateur from "@/components/HorsSimulateur";
import { LocalBusinessSchema, OrganizationSchema } from "@/components/JsonLd";

import { DELAI_REPONSE, PRIX_PLAGE } from "@/lib/offre";
import { ENTREPRISE } from "@/lib/entreprise";
import { IMAGE_PARTAGE } from "@/lib/partage";
/**
 * Site 3.0 (lot B1) : Playfair Display pour les titres (400 à 900, droit et italique) et Libre Franklin pour le texte,
 * en polices variables téléchargées au build et servies par le site (next/font) : aucun appel à Google Fonts depuis
 * le navigateur. `display: swap`, préchargées, et une police de repli ajustée (adjustFontFallback, par défaut) contre
 * le décalage au chargement. Les jetons --font-display et --font-sans de globals.css pointent sur ces variables.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const franklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-franklin",
  display: "swap",
});

/**
 * Site 3.0 (lot F3) : une seule adresse du site, `ENTREPRISE.site` (https://coverswap.fr, l'hôte gardé : le www et
 * l'adresse vercel.app de production y redirigent en 301, vercel.json). Aucune adresse canonique par défaut ici :
 * chaque page pose la sienne (`metadonneesPage`) ; la 404 et les pages privées n'en ont pas (avant, elles héritaient
 * de celle de l'accueil).
 */
const SITE_URL = ENTREPRISE.site;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CoverSwap — Covering adhésif premium, rénovation en 1 jour",
    template: "%s | CoverSwap",
  },
  description:
    `Rénovez cuisine, salle de bain et meubles en 1 journée grâce au covering adhésif premium. Simulation IA gratuite. Devis gratuit ${DELAI_REPONSE}. Prix au mètre linéaire, ${PRIX_PLAGE} fourni et posé selon la complexité de la pose.`,
  keywords:
    "covering adhésif, rénovation cuisine, covering salle de bain, covering meubles, revêtement adhésif, simulation IA, rénovation rapide",
  applicationName: "CoverSwap",
  authors: [{ name: "Lucas Villemin", url: SITE_URL }],
  creator: "CoverSwap",
  publisher: "CoverSwap",
  openGraph: {
    title: "CoverSwap — Covering adhésif premium, rénovation en 1 jour",
    description:
      `Rénovez cuisine, salle de bain et meubles en 1 journée. Simulation IA gratuite. Prix au mètre linéaire, ${PRIX_PLAGE} fourni et posé selon la complexité de la pose.`,
    url: SITE_URL,
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
    // Site 3.0 (lot F2) : l'image du site, une seule source (`lib/partage`) ; chaque page pose la sienne (`metadonneesPage`).
    images: [
      {
        url: IMAGE_PARTAGE.url,
        width: IMAGE_PARTAGE.largeur,
        height: IMAGE_PARTAGE.hauteur,
        alt: "CoverSwap — Covering adhésif premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CoverSwap — Covering adhésif premium",
    description: "Rénovez votre intérieur en 1 journée. Simulation IA gratuite.",
    images: [IMAGE_PARTAGE.url],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** La couleur de la barre du navigateur = le papier (jeton --color-fond, vérifié par theme.test.ts) ; l'espace client (/e/…) a la même. */
export const viewport: Viewport = {
  themeColor: "#F4EDE2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${playfair.variable} ${franklin.variable}`}>
      <body className="bg-fond font-sans text-encre antialiased">
        {/* Tout ce qui suit disparaît sur l'espace client (/e/…) : page privée, sans suivi de parcours ni habillage commercial. */}
        {/* Mission 16 (partie 6) : aucun script tiers ni cookie de mesure (GTM, GA4, pixel Meta, Clarity et Vercel Analytics retirés,
            plus de bandeau cookies). La seule mesure est première partie et sans cookie : SuiviParcours → CRM. */}
        <HorsEspaceClient>
          <LocalBusinessSchema />
          <OrganizationSchema />
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <Suspense fallback={null}>
            <SuiviParcours />
          </Suspense>
          {/* Le simulateur porte la variante compacte de l'en-tête (retour à l'accueil). */}
          <HorsSimulateur>
            <EnteteSite />
          </HorsSimulateur>
        </HorsEspaceClient>
        <main id="main-content">{children}</main>
        <HorsEspaceClient>
          <PiedDePage />
        </HorsEspaceClient>
      </body>
    </html>
  );
}
