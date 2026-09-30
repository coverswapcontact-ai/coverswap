import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import CatalogueClient from "@/components/CatalogueClient";

import { NB_REFERENCES } from "@/lib/offre";
export const metadata: Metadata = {
  title: `Catalogue Revêtements Cover Styl' — ${NB_REFERENCES} références`,
  description:
    `Explorez notre catalogue complet de revêtements adhésifs Cover Styl'. Bois, pierre, béton, métal, couleur, textile, paillettes. ${NB_REFERENCES} références disponibles.`,
  keywords:
    "catalogue cover styl, revêtement adhésif, covering mural, film adhésif décoratif, bois adhésif, marbre adhésif, béton adhésif",
  alternates: {
    canonical: "https://coverswap.fr/revetements",
  },
};

export default function RevetementsPage() {
  return (
    <div className="bg-fond px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Catalogue" }]} />
        <h1 className="titre-1 text-encre">Catalogue Cover Styl&apos;</h1>
        <p className="texte mt-4 max-w-2xl text-encre-2">Près de 500 références disponibles &mdash; bois, pierre, béton, métal, couleur, textile, paillettes</p>
        <div className="mt-6">
          <CatalogueClient />
        </div>
      </div>
    </div>
  );
}
