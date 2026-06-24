import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import TextureBackground from "@/components/TextureBackground";
import { FAQSchema, BreadcrumbSchema } from "@/components/JsonLd";
import { ZONES, getZoneSlug, getZoneBySlug, type Zone } from "@/data/zones";

/* ──────────────────────────────────────────────────────────────────
   STATIC GENERATION — pré-build des 8 pages au build time
────────────────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  return ZONES.map((z) => ({ slug: getZoneSlug(z) }));
}

/* ──────────────────────────────────────────────────────────────────
   METADATA — title / description / OG / canonical par ville
────────────────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) return {};

  const title = `Covering Adhésif ${zone.ville} — Rénovation Cuisine & Salle de Bain en 1 Jour | CoverSwap`;
  const description = `Covering adhésif premium à ${zone.ville} (${zone.codePostal.split(" / ")[0]}). Rénovation cuisine, salle de bain, meubles en 1 journée. Pose Cover Styl' garantie 10 ans, devis gratuit sous 24h. À partir de 80 €/m².`;
  const url = `https://coverswap.fr/zones/${getZoneSlug(zone)}`;

  return {
    title,
    description,
    keywords: `covering ${zone.ville}, rénovation cuisine ${zone.ville}, covering adhésif ${zone.ville}, relooking meubles ${zone.ville}, film adhésif ${zone.ville}, Cover Styl ${zone.ville}, covering Hérault, covering Occitanie`,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "CoverSwap",
      locale: "fr_FR",
      images: [
        {
          url: "https://coverswap.fr/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `Covering adhésif à ${zone.ville} — CoverSwap`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://coverswap.fr/og-image.jpg"],
    },
    robots: { index: true, follow: true },
  };
}

/* ──────────────────────────────────────────────────────────────────
   JSON-LD — LocalBusiness ciblé sur la ville + Service
────────────────────────────────────────────────────────────────── */
function ZoneLocalBusinessSchema({ zone }: { zone: Zone }) {
  const url = `https://coverswap.fr/zones/${getZoneSlug(zone)}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name: `CoverSwap — Covering ${zone.ville}`,
    image: "https://coverswap.fr/og-image.jpg",
    url,
    telephone: "+33670352869",
    email: "contact@coverswap.fr",
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: "73 rue Simone Veil",
      addressLocality: "Pérols",
      postalCode: "34470",
      addressRegion: "Occitanie",
      addressCountry: "FR",
    },
    areaServed: {
      "@type": "City",
      name: zone.ville,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Hérault",
      },
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: zone.lat,
      longitude: zone.lng,
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Covering adhésif à ${zone.ville}`,
    description: `Rénovation par revêtement adhésif Cover Styl' à ${zone.ville} : cuisines, salles de bain, meubles, surfaces professionnelles. Pose en 1 journée, 497 références disponibles.`,
    url,
    provider: {
      "@type": "LocalBusiness",
      name: "CoverSwap",
      url: "https://coverswap.fr",
      telephone: "+33670352869",
      address: {
        "@type": "PostalAddress",
        streetAddress: "73 rue Simone Veil",
        addressLocality: "Pérols",
        postalCode: "34470",
        addressCountry: "FR",
      },
    },
    areaServed: {
      "@type": "City",
      name: zone.ville,
    },
    serviceType: "Rénovation par covering adhésif",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────
   PAGE
────────────────────────────────────────────────────────────────── */
export default async function ZonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const zone = getZoneBySlug(slug);
  if (!zone) notFound();

  const otherZones = ZONES.filter((z) => z.slug !== zone.slug);
  const url = `https://coverswap.fr/zones/${getZoneSlug(zone)}`;

  return (
    <main className="bg-noir min-h-screen">
      <ZoneLocalBusinessSchema zone={zone} />
      <FAQSchema faqs={zone.faqLocale.map((f) => ({ q: f.q, a: f.a }))} />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://coverswap.fr" },
          { name: "Zones d'intervention", url: "https://coverswap.fr/zones" },
          { name: `Covering ${zone.ville}`, url },
        ]}
      />

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative section-padding pt-40 overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.82)"
          fadeTop={false}
          fadeBottom
        />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-rouge/5 blur-[100px]" />
        <div className="container-custom relative z-20">
          {/* Breadcrumb UI */}
          <ScrollReveal direction="fade">
            <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-gris-400 mb-8">
              <Link href="/" className="hover:text-white transition-colors">
                Accueil
              </Link>
              <span className="text-gris-600">/</span>
              <Link href="/zones" className="hover:text-white transition-colors">
                Zones d&apos;intervention
              </Link>
              <span className="text-gris-600">/</span>
              <span className="text-white">Covering {zone.ville}</span>
            </nav>
          </ScrollReveal>

          <ScrollReveal direction="up">
            <span className="inline-block text-rouge uppercase tracking-widest text-sm font-bold mb-4">
              Zone d&apos;intervention · {zone.codePostal.split(" / ")[0]}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-4xl">
              Covering adhésif à <span className="text-rouge">{zone.ville}</span> — Rénovez votre cuisine en 1 journée
            </h1>
            <p className="text-gris-300 text-lg max-w-3xl leading-relaxed mb-10">
              Vous habitez {zone.ville} et souhaitez moderniser votre cuisine, salle de bain ou vos meubles sans
              engager de gros travaux&nbsp;? Nous intervenons à {zone.ville} et dans toute la métropole avec le covering
              adhésif Cover Styl&apos;&nbsp;: pose en 1 journée, 497 références au catalogue, garanti 10 ans.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/simulation" className="btn-primary">
                Simuler mon projet ({zone.ville})
              </Link>
              <Link href="/contact" className="btn-secondary">
                Devis gratuit sous 24h
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gris-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Atelier à {zone.distanceKm === 0 ? "Pérols (chez vous)" : `${zone.distanceKm} km de ${zone.ville}`}
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Devis sous 24 à 48 h
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Garanti 10 ans Cover Styl&apos;
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════ INTRO + QUARTIERS ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom max-w-5xl">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-12">
              Le covering Cover Styl&apos; à <span className="text-rouge">{zone.ville}</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-gris-300 leading-relaxed space-y-5 text-base">
              {zone.intro.split(/\n+/).filter(Boolean).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </ScrollReveal>

          {/* Liste quartiers */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="mt-12 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              <h3 className="font-display text-xl font-bold mb-4">
                Quartiers et secteurs couverts à {zone.ville}
              </h3>
              <div className="flex flex-wrap gap-2">
                {zone.quartiers.map((q) => (
                  <span
                    key={q}
                    className="inline-flex items-center gap-1.5 bg-rouge/10 border border-rouge/30 text-white text-sm rounded-full px-3 py-1.5"
                  >
                    <svg className="w-3 h-3 text-rouge" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {q}
                  </span>
                ))}
              </div>
              <p className="text-gris-500 text-sm mt-4 italic">
                Votre quartier ne figure pas dans la liste&nbsp;? Nous intervenons sur l&apos;ensemble du territoire
                de {zone.ville} et de ses communes voisines. Contactez-nous pour confirmer.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════ NOS PRESTATIONS DANS LA VILLE ══════════════════ */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20 max-w-5xl">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-4">
              Nos prestations covering à <span className="text-rouge">{zone.ville}</span>
            </h2>
            <p className="text-gris-400 text-center max-w-2xl mx-auto mb-16">
              Toute la palette du covering Cover Styl&apos; disponible chez vous, en un seul jour de pose.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                href: "/prestations/cuisine",
                title: `Covering Cuisine à ${zone.ville}`,
                icon: "🍳",
                desc: "Plans de travail, crédences, façades de meubles. Effet marbre, bois, béton.",
              },
              {
                href: "/prestations/salle-de-bain",
                title: `Covering SDB à ${zone.ville}`,
                icon: "🛁",
                desc: "Carrelage mural, meubles vasque, portes : rénovation sans dépose.",
              },
              {
                href: "/prestations/meubles",
                title: `Covering Meubles à ${zone.ville}`,
                icon: "🪑",
                desc: "Dressing, bibliothèque, commodes : seconde vie à votre mobilier.",
              },
              {
                href: "/prestations/professionnel",
                title: `Covering Pro à ${zone.ville}`,
                icon: "🏢",
                desc: "Bureaux, comptoirs, vitrines : modernisation rapide de vos locaux.",
              },
              {
                href: "/prestations/vitrages",
                title: `Covering Vitrages à ${zone.ville}`,
                icon: "🪟",
                desc: "Films décoratifs, occultants, dépoli sur mesure pour vitres et baies.",
              },
              {
                href: "/revetements",
                title: "Catalogue Cover Styl'",
                icon: "🎨",
                desc: "Parcourez les 497 références : bois, pierre, métal, textile, couleurs unies.",
              },
            ].map((p) => (
              <ScrollReveal key={p.href} direction="up">
                <Link
                  href={p.href}
                  className="block bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-rouge/40 hover:bg-rouge/5 transition-all duration-300 h-full"
                >
                  <span className="text-3xl mb-3 block">{p.icon}</span>
                  <h3 className="font-display text-lg font-bold mb-2 text-white">{p.title}</h3>
                  <p className="text-gris-400 text-sm leading-relaxed">{p.desc}</p>
                  <span className="inline-flex items-center gap-1 text-rouge text-sm font-semibold mt-4 group-hover:gap-2 transition-all">
                    Découvrir
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

      {/* ══════════════════ POURQUOI COVERSWAP À [VILLE] ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom max-w-5xl">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-12">
              Pourquoi choisir CoverSwap à <span className="text-rouge">{zone.ville}</span>&nbsp;?
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <ScrollReveal direction="left">
              <div className="space-y-5">
                <p className="text-gris-300 leading-relaxed">{zone.pourquoi}</p>
                <p className="text-gris-300 leading-relaxed">
                  <strong className="text-white">Type d&apos;habitat couvert à {zone.ville}&nbsp;:</strong>{" "}
                  {zone.habitat}.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    value: `${zone.distanceKm === 0 ? "Sur place" : zone.distanceKm + " km"}`,
                    label: "depuis Pérols",
                  },
                  { value: "24 à 48h", label: "pour un devis" },
                  { value: "1 jour", label: "de pose typique" },
                  { value: "10 ans", label: "garanti Cover Styl'" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center"
                  >
                    <span className="block font-display text-2xl font-bold text-rouge mb-1">
                      {stat.value}
                    </span>
                    <span className="text-gris-400 text-sm">{stat.label}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ══════════════════ FAQ LOCALE ══════════════════ */}
      <section className="relative section-padding overflow-hidden">
        <TextureBackground
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1920&q=80"
          overlay="rgba(0,0,0,0.85)"
          fadeTop
          fadeBottom
        />
        <div className="container-custom relative z-20 max-w-3xl">
          <ScrollReveal direction="up">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">
              Questions fréquentes &mdash; <span className="text-rouge">{zone.ville}</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-4">
            {zone.faqLocale.map((faq) => (
              <ScrollReveal key={faq.q} direction="up">
                <details className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 group cursor-pointer">
                  <summary className="flex items-center justify-between font-display font-bold text-lg list-none">
                    {faq.q}
                    <svg
                      className="w-5 h-5 text-rouge shrink-0 group-open:rotate-45 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </summary>
                  <p className="text-gris-400 mt-4 leading-relaxed">{faq.a}</p>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ AUTRES ZONES (maillage interne) ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom max-w-5xl">
          <ScrollReveal direction="up">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-4">
              Autres zones d&apos;intervention CoverSwap
            </h2>
            <p className="text-gris-400 text-center mb-12 text-sm">
              Nous intervenons aussi dans ces villes proches de {zone.ville} et partout en Hérault &amp; Occitanie.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherZones.map((z) => (
              <Link
                key={z.slug}
                href={`/zones/${getZoneSlug(z)}`}
                className="block bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:border-rouge/40 hover:bg-rouge/5 transition-all text-center"
              >
                <span className="block text-white font-medium text-sm">Covering {z.ville}</span>
                <span className="text-gris-500 text-xs">{z.codePostal.split(" / ")[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section className="section-padding bg-noir">
        <div className="container-custom text-center">
          <ScrollReveal direction="scale">
            <div className="bg-white/5 backdrop-blur border border-rouge/20 bg-rouge/5 rounded-2xl p-12 max-w-3xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Votre projet covering à <span className="text-rouge">{zone.ville}</span> commence ici
              </h2>
              <p className="text-gris-300 text-lg mb-8 max-w-xl mx-auto">
                Envoyez-nous une photo, recevez un rendu IA en 60 secondes et un devis détaillé sous 24 à 48 heures.
                Sans engagement, sans visite obligatoire.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/simulation" className="btn-primary text-lg px-10 py-5">
                  Simuler mon projet
                </Link>
                <a
                  href="https://wa.me/33670352869"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-lg px-10 py-5"
                >
                  WhatsApp direct
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
