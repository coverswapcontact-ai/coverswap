import type { Metadata } from "next";
import CatalogueClient from "@/components/CatalogueClient";

export const metadata: Metadata = {
  title: "Catalogue Revêtements Cover Styl' | +470 Références | CoverSwap",
  description:
    "Explorez notre catalogue complet de revêtements adhésifs Cover Styl'. Bois, pierre, béton, métal, couleur, textile, paillettes. Plus de 470 références disponibles.",
  keywords:
    "catalogue cover styl, revêtement adhésif, covering mural, film adhésif décoratif, bois adhésif, marbre adhésif, béton adhésif",
};

export default function RevetementsPage() {
  return <CatalogueClient />;
}
