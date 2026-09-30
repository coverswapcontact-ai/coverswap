import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContenuPrestation from "@/components/ContenuPrestation";
import { PRESTATIONS, getPrestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";

type Props = { params: Promise<{ slug: string }> };

/** Mission 16 (partie 4) : « professionnel » n'est plus générée — `/prestations/professionnel` est redirigée vers /pro (next.config.ts). */
export function generateStaticParams() {
  return PRESTATIONS.filter((p) => p.slug !== "professionnel").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p) return {};
  const url = `${ENTREPRISE.site}/prestations/${p.slug}`;
  return {
    title: { absolute: `${p.titreSeo} | CoverSwap` },
    description: p.descriptionSeo,
    alternates: { canonical: url },
    openGraph: { title: p.titreSeo, description: p.descriptionSeo, url, type: "website", siteName: "CoverSwap", locale: "fr_FR", images: [{ url: `${ENTREPRISE.site}/og-image.jpg`, width: 1200, height: 630 }] },
  };
}

export default async function PagePrestation({ params }: Props) {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p) notFound();
  const url = `${ENTREPRISE.site}/prestations/${p.slug}`;
  return (
    <ContenuPrestation
      p={p}
      url={url}
      fil={[{ label: "Accueil", href: "/" }, { label: "Prestations", href: "/prestations" }, { label: p.court }]}
      filSchema={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Prestations", url: `${ENTREPRISE.site}/prestations` }, { name: p.nom, url }]}
    />
  );
}
