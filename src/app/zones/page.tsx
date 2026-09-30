import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { ZONES, getZoneSlug } from "@/data/zones";

export const metadata: Metadata = {
  title: { absolute: "Zones d'intervention CoverSwap — Covering Adhésif Hérault & Occitanie" },
  description:
    "CoverSwap intervient à Montpellier, Pérols, Lattes, Mauguio, Castelnau-le-Lez, Béziers, Nîmes, Sète et dans toute la France. Découvrez nos prestations de covering adhésif Cover Styl' par ville.",
  keywords:
    "covering Montpellier, covering Pérols, covering Hérault, covering Occitanie, rénovation cuisine Montpellier, covering adhésif France, zone intervention covering",
  alternates: { canonical: "https://coverswap.fr/zones" },
  openGraph: {
    title: "Zones d'intervention CoverSwap — Hérault, Occitanie, France entière",
    description:
      "Covering adhésif premium dans toutes les grandes villes d'Hérault et d'Occitanie. Pose en 1 journée, garantie 10 ans.",
    url: "https://coverswap.fr/zones",
    type: "website",
    siteName: "CoverSwap",
    locale: "fr_FR",
  },
};

export default function ZonesIndexPage() {
  const sortedZones = [...ZONES].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="bg-fond">
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://coverswap.fr" },
          { name: "Zones d'intervention", url: "https://coverswap.fr/zones" },
        ]}
      />

      {/* OUVERTURE */}
      <section className="bg-fond-2 px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Zones d'intervention" }]} />
          <p className="surtitre">Hérault · Occitanie · France entière</p>
          <h1 className="titre-1 mt-2 max-w-3xl text-encre">Zones d&apos;intervention CoverSwap</h1>
          <p className="texte mt-4 max-w-3xl text-encre-2">
            Basés à Pérols, nous intervenons en priorité sur l&apos;agglomération de Montpellier et tout l&apos;Hérault,
            et nous nous déplaçons partout en Occitanie et en France pour les projets de plus de 15 mètres linéaires.
            Découvrez ci-dessous nos villes d&apos;intervention privilégiées.
          </p>
        </div>
      </section>

      {/* VILLES */}
      <Section large>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedZones.map((zone) => (
            <Link
              key={zone.slug}
              href={`/zones/${getZoneSlug(zone)}`}
              className="block h-full rounded-[var(--rayon-md)] border border-trait bg-white p-6 transition-colors duration-[var(--duree-courte)] hover:border-encre"
            >
              <h2 className="mb-1 text-[17px] font-semibold text-encre">Covering {zone.ville}</h2>
              <p className="mb-4 text-[13.5px] text-encre-2">
                {zone.codePostal.split(" / ")[0]} · {zone.distanceKm === 0 ? "Notre commune" : `${zone.distanceKm} km depuis Pérols`}
              </p>
              <p className="texte-2 mb-4 line-clamp-3">{zone.habitat}</p>
              <p className="text-[13px] text-encre-2">
                {zone.quartiers.slice(0, 3).join(" · ")}
                {zone.quartiers.length > 3 ? ` · +${zone.quartiers.length - 3}` : ""}
              </p>
              <span className="mt-4 inline-flex text-[15px] font-medium text-encre underline underline-offset-4">Voir la page locale</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* AUTRES ZONES — France entière */}
      <Section
        titre="Votre ville n'est pas dans la liste ?"
        intro="Nous nous déplaçons partout en France pour les projets significatifs (à partir de 15 mètres linéaires de covering). Si vous êtes à Lyon, Toulouse, Marseille, Bordeaux, Paris ou ailleurs, contactez-nous : nous trouverons une formule adaptée (déplacement groupé, planning optimisé)."
        fond="fond-2"
      >
        <Lien href="/contact">Demander un devis pour ma ville</Lien>
      </Section>
    </div>
  );
}
