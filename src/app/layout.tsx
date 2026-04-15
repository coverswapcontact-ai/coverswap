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
    default: "CoverSwap | Rénovation intérieure par revêtements adhésifs texturés",
    template: "%s | CoverSwap",
  },
  description:
    "Transformez votre intérieur en 1 journée avec nos revêtements adhésifs haut de gamme. Simulation IA gratuite en 60 secondes. Cuisine, salle de bain, meubles — à partir de 80 €/m².",
  keywords:
    "covering adhésif, rénovation intérieure, revêtement adhésif, covering cuisine, covering salle de bain, covering meubles, covering professionnel, simulation IA",
  openGraph: {
    title: "CoverSwap | Rénovation intérieure premium par covering adhésif",
    description:
      "Transformez votre intérieur en 1 journée. Simulation IA gratuite en 60 secondes.",
    url: SITE_URL,
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "CoverSwap — Rénovation intérieure par covering adhésif",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CoverSwap | Rénovation intérieure premium",
    description: "Transformez votre intérieur en 1 journée. Simulation IA gratuite.",
    images: [`${SITE_URL}/og-image.jpg`],
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
