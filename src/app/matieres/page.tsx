import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import CatalogueClient from "@/components/CatalogueClient";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Section } from "@/components/simulation/Section";
import { ENTREPRISE } from "@/lib/entreprise";
import { NB_REFERENCES } from "@/lib/offre";

/**
 * « Matières » (mission 16, partie 1) : page de transition. Elle rend le
 * catalogue existant (`CatalogueClient`, thème clair) avec les textes de
 * `/revetements`. La partie 4-5 la rebâtit sur `FeuilleCatalogue` (textures
 * en grand, « Essayer sur ma photo ») ; `/revetements` passera alors en 301.
 */
const URL_PAGE = `${ENTREPRISE.site}/matieres`;
const TITRE = `Matières : catalogue Cover Styl' — ${NB_REFERENCES} références`;
const DESCRIPTION = `Explorez notre catalogue complet de revêtements adhésifs Cover Styl'. Bois, pierre, béton, métal, couleur, textile, paillettes. ${NB_REFERENCES} références disponibles.`;

export const metadata: Metadata = {
  title: TITRE,
  description: DESCRIPTION,
  alternates: { canonical: URL_PAGE },
  openGraph: { title: `${TITRE} | CoverSwap`, description: DESCRIPTION, url: URL_PAGE, type: "website", siteName: "CoverSwap", locale: "fr_FR", images: [{ url: `${ENTREPRISE.site}/og-image.jpg`, width: 1200, height: 630 }] },
};

export default function PageMatieres() {
  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Matières", url: URL_PAGE }]} />
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Matières" }]} />
          <p className="surtitre">Matières</p>
          <h1 className="titre-1 mt-2 text-encre">Catalogue Cover Styl&apos;</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">Près de 500 références disponibles &mdash; bois, pierre, béton, métal, couleur, textile, paillettes</p>
        </div>
      </section>
      <Section large className="pt-6 md:pt-6">
        <CatalogueClient />
      </Section>
    </div>
  );
}
