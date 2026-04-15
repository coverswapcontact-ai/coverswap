import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import WhatsAppButton from "@/components/WhatsAppButton";
import Analytics from "@/components/Analytics";
import ScrollToTop from "@/components/ScrollToTop";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://coverswap.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CoverSwap — Covering adhésif premium, rénovation en 1 jour",
    template: "%s | CoverSwap",
  },
  description:
    "Rénovez cuisine, salle de bain et meubles en 1 journée grâce au covering adhésif premium. Simulation IA gratuite. Devis en 60s. À partir de 80 €/m² posé.",
  keywords:
    "covering adhésif, rénovation cuisine, covering salle de bain, covering meubles, revêtement adhésif, simulation IA, rénovation rapide",
  applicationName: "CoverSwap",
  authors: [{ name: "Lucas Villemin", url: SITE_URL }],
  creator: "CoverSwap",
  publisher: "CoverSwap",
  openGraph: {
    title: "CoverSwap — Covering adhésif premium, rénovation en 1 jour",
    description:
      "Rénovez cuisine, salle de bain et meubles en 1 journée. Simulation IA gratuite. À partir de 80 €/m² posé.",
    url: SITE_URL,
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "CoverSwap — Covering adhésif premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CoverSwap — Covering adhésif premium",
    description: "Rénovez votre intérieur en 1 journée. Simulation IA gratuite.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
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

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        {/* GTM noscript fallback */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <LocalBusinessSchema />
        <OrganizationSchema />
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <CookieBanner />
        <WhatsAppButton />
        <Analytics />
      </body>
    </html>
  );
}
