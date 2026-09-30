import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContenuPrestation from "@/components/ContenuPrestation";
import { getPrestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";

/**
 * « Pro » (mission 16, partie 1) : page de transition. Elle rend le contenu de
 * `/prestations/professionnel` tel quel (textes, FAQ, balisage), avec
 * « Demander un devis » → `/contact` en bouton principal. La partie 5 la
 * réécrit (références, arguments, formulaire photos + surface) ; l'ancienne
 * adresse passera alors en 301 vers celle-ci.
 */
const PRO = getPrestation("professionnel");
const URL_PRO = `${ENTREPRISE.site}/pro`;

export const metadata: Metadata = PRO
  ? {
      title: { absolute: `${PRO.titreSeo} | CoverSwap` },
      description: PRO.descriptionSeo,
      alternates: { canonical: URL_PRO },
      openGraph: { title: PRO.titreSeo, description: PRO.descriptionSeo, url: URL_PRO, type: "website", siteName: "CoverSwap", locale: "fr_FR", images: [{ url: `${ENTREPRISE.site}/og-image.jpg`, width: 1200, height: 630 }] },
    }
  : {};

export default function PagePro() {
  if (!PRO) notFound();
  return (
    <ContenuPrestation
      p={PRO}
      url={URL_PRO}
      fil={[{ label: "Accueil", href: "/" }, { label: "Pro" }]}
      filSchema={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Pro", url: URL_PRO }]}
      lienDevis="/contact"
      devisPrincipal
    />
  );
}
