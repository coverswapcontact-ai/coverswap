import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { etudeDeLaPiece } from "@/components/accueil/etudes";
import ContenuPrestation from "@/components/ContenuPrestation";
import { PRESTATIONS, getPrestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { chargerPublications } from "@/lib/publications";

type Props = { params: Promise<{ slug: string }> };

/**
 * Les pages par pièce (mission 16, partie 5) : cuisine, salle de bain, meubles (et vitrages, hors menu, liée depuis
 * /pro et /comment-ca-marche) ; adresses conservées. « professionnel » n'est plus générée (partie 4 : 301 vers /pro).
 * L'index /prestations est redirigé vers /realisations (301) : le fil d'Ariane passe par « Réalisations ». L'étude de
 * cas lit les publications du CRM : relue toutes les cinq minutes, comme /realisations.
 */
export const revalidate = 300;

export function generateStaticParams() {
  return PRESTATIONS.filter((p) => p.slug !== "professionnel").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p) return {};
  return metadonneesPage({ titre: `${p.titreSeo} | CoverSwap`, description: p.descriptionSeo, chemin: `/prestations/${p.slug}` });
}

export default async function PagePrestation({ params }: Props) {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p || p.slug === "professionnel") notFound();
  const url = `${ENTREPRISE.site}/prestations/${p.slug}`;
  const { realisations } = await chargerPublications();
  return (
    <ContenuPrestation
      p={p}
      url={url}
      // Vitrages : type « AUTRE » au CRM, qui range aussi d'autres chantiers : pas d'étude de cas rapprochée par erreur.
      etude={p.simulateur ? etudeDeLaPiece(p.crmTypeProjet, p.simulateur, realisations) : null}
      fil={[{ label: "Accueil", href: "/" }, { label: "Réalisations", href: "/realisations" }, { label: p.court }]}
      filSchema={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Réalisations", url: `${ENTREPRISE.site}/realisations` }, { name: p.nom, url }]}
    />
  );
}
