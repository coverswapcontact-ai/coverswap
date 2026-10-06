import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { partageOuverture, prechargementsOuverture } from "@/components/accueil/etudes";
import ContenuPrestation, { TAILLES_OUVERTURE_PRESTATION, vueDeLaPrestation } from "@/components/ContenuPrestation";
import { PRESTATIONS, getPrestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { chargerPublications } from "@/lib/publications";
import { chargerTarifs } from "@/lib/tarifs-site";

type Props = { params: Promise<{ slug: string }> };

/**
 * Les pages par pièce (mission 16, partie 5 ; site 3.0, lot C1) : cuisine, salle de bain, meubles (et vitrages, hors
 * menu, liée depuis /pro et /comment-ca-marche) ; adresses conservées. « professionnel » n'est plus générée (partie
 * 4 : 301 vers /pro). L'index /prestations est redirigé vers /realisations (301) : le fil d'Ariane passe par
 * « Réalisations ». L'ouverture et les cas lisent les publications du CRM (relues toutes les cinq minutes, comme
 * /realisations), les prix ses tarifs (une heure). L'« avant » de l'ouverture est le LCP : préchargé ici, comme sur
 * l'accueil.
 */
export const revalidate = 300;

export function generateStaticParams() {
  return PRESTATIONS.filter((p) => p.slug !== "professionnel").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p) return {};
  // Site 3.0 (lot F2) : l'image de partage suit l'ouverture (une réalisation de la pièce, sinon son avant / après).
  const chemin = `/prestations/${p.slug}`;
  const { realisations } = await chargerPublications();
  return metadonneesPage({ titre: `${p.titreSeo} | CoverSwap`, description: p.descriptionSeo, chemin, image: partageOuverture(vueDeLaPrestation(p, realisations).ouverture, chemin) });
}

export default async function PagePrestation({ params }: Props) {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p || p.slug === "professionnel") notFound();
  const url = `${ENTREPRISE.site}/prestations/${p.slug}`;
  const [{ realisations }, tarifs] = await Promise.all([chargerPublications(), chargerTarifs()]);
  const ouverture = vueDeLaPrestation(p, realisations).ouverture;
  for (const prechargement of prechargementsOuverture(ouverture, TAILLES_OUVERTURE_PRESTATION)) preload(prechargement.href, prechargement.options);
  return (
    <ContenuPrestation
      p={p}
      url={url}
      realisations={realisations}
      tarifs={tarifs}
      fil={[{ label: "Accueil", href: "/" }, { label: "Réalisations", href: "/realisations" }, { label: p.court }]}
      filSchema={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Réalisations", url: `${ENTREPRISE.site}/realisations` }, { name: p.nom, url }]}
    />
  );
}
