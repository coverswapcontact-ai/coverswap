import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import TextureBackground from "@/components/TextureBackground";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { ZONES, getZoneSlug } from "@/data/zones";

export const metadata: Metadata = {
  title: "Zones d'intervention CoverSwap — Covering Adhésif Hérault & Occitanie",
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
    <main className="bg-noir min-h-screen">
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://coverswap.fr" },
          { name: "Zones d'intervention", url: "https://coverswap.fr/zones" },
        ]}
      />

      {/* HERO */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.82)"
          fadeTop={false}
          fadeBottom
        />
        <div className="container-custom relative z-20 max-w-4xl">
          <ScrollReveal direction="fade">
            <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-gris-400 mb-8">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <span className="text-gris-600">/</span>
              <span className="text-white">Zones d&apos;intervention</span>
            </nav>
          </ScrollReveal>

          <ScrollReveal direction="up">
            <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
              Hérault · Occitanie · France entière
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Zones d&apos;intervention <span className="text-rouge">CoverSwap</span>
            </h1>
            <p className="text-gris-300 text-lg max-w-3xl leading-relaxed mb-10">
              Basés à Pérols, nous intervenons en priorité sur l&apos;agglomération de Montpellier et tout l&apos;Hérault,
              et nous nous déplaçons partout en Occitanie et en France pour les projets de plus de 15 mètres linéaires.
              Découvrez ci-dessous nos villes d&apos;intervention privilégiées.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* GRID VILLES */}
      <section className="section-padding bg-noir">
        <div className="container-custom max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedZones.map((zone) => (
              <ScrollReveal key={zone.slug} direction="up">
                <Link
                  href={`/zones/${getZoneSlug(zone)}`}
                  className="block bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-rouge/40 hover:bg-rouge/5 transition-all duration-300 h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-white mb-1">
                        Covering {zone.ville}
                      </h2>
                      <span className="text-gris-500 text-xs">
                        {zone.codePostal.split(" / ")[0]} ·{" "}
                        {zone.distanceKm === 0 ? "Atelier sur place" : `${zone.distanceKm} km depuis Pérols`}
                      </span>
                    </div>
                    <span className="w-9 h-9 rounded-full bg-rouge/10 border border-rouge/30 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                  </div>
                  <p className="text-gris-400 text-sm leading-relaxed line-clamp-3 mb-4">
                    {zone.habitat}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.quartiers.slice(0, 3).map((q) => (
                      <span
                        key={q}
                        className="text-[11px] text-gris-500 bg-white/5 px-2 py-0.5 rounded-full"
                      >
                        {q}
                      </span>
                    ))}
                    {zone.quartiers.length > 3 && (
                      <span className="text-[11px] text-gris-500">+{zone.quartiers.length - 3}</span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-rouge text-sm font-semibold mt-4">
                    Voir la page locale
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* AUTRES ZONES — France entière */}
      <section className="section-padding bg-noir">
        <div className="container-custom max-w-4xl">
          <ScrollReveal direction="up">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                Votre ville n&apos;est pas dans la liste&nbsp;?
              </h2>
              <p className="text-gris-300 leading-relaxed mb-8 max-w-2xl mx-auto">
                Nous nous déplaçons partout en France pour les projets significatifs (à partir de 15 mètres linéaires de
                covering). Si vous êtes à Lyon, Toulouse, Marseille, Bordeaux, Paris ou ailleurs, contactez-nous : nous
                trouverons une formule adaptée (déplacement groupé, planning optimisé).
              </p>
              <Link href="/contact" className="btn-primary">
                Demander un devis pour ma ville
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
