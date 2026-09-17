import type { Metadata } from "next";
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
  return <CatalogueClient />;
}
