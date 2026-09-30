import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { FAQSchema, BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { ENTREPRISE } from "@/lib/entreprise";
import { ZONES, getZoneSlug, getZoneBySlug, type Zone } from "@/data/zones";
import { DELAI_RENDU, DELAI_REPONSE, DELAI_REPONSE_COURT, GARANTIE, NB_REFERENCES, PRIX_PLAGE, texteOffre } from "@/lib/offre";

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
  const description = `Covering adhésif premium à ${zone.ville} (${zone.codePostal.split(" / ")[0]}). Rénovation cuisine, salle de bain, meubles en 1 journée. Pose Cover Styl' garantie 10 ans, devis gratuit ${DELAI_REPONSE}. Prix au mètre linéaire, ${PRIX_PLAGE} selon la complexité de la pose.`;
  const url = `https://coverswap.fr/zones/${getZoneSlug(zone)}`;

  return {
    title: { absolute: title },
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
    description: `Rénovation par revêtement adhésif Cover Styl' à ${zone.ville} : cuisines, salles de bain, meubles, surfaces professionnelles. Pose en 1 journée, ${NB_REFERENCES} références disponibles.`,
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

  const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white";
  const prestationsVille = [
    { href: "/prestations/cuisine", title: `Covering Cuisine à ${zone.ville}`, desc: "Plans de travail, crédences, façades de meubles. Effet marbre, bois, béton." },
    { href: "/prestations/salle-de-bain", title: `Covering SDB à ${zone.ville}`, desc: "Carrelage mural, meubles vasque, portes : rénovation sans dépose." },
    { href: "/prestations/meubles", title: `Covering Meubles à ${zone.ville}`, desc: "Dressing, bibliothèque, commodes : seconde vie à votre mobilier." },
    { href: "/pro", title: `Covering Pro à ${zone.ville}`, desc: "Bureaux, comptoirs, vitrines : modernisation rapide de vos locaux." },
    { href: "/prestations/vitrages", title: `Covering Vitrages à ${zone.ville}`, desc: "Films décoratifs, occultants, dépoli sur mesure pour vitres et baies." },
    { href: "/matieres", title: "Catalogue Cover Styl'", desc: `Parcourez les ${NB_REFERENCES} références : bois, pierre, métal, textile, couleurs unies.` },
  ];

  return (
    <div className="bg-fond">
      <ZoneLocalBusinessSchema zone={zone} />
      <FAQSchema faqs={zone.faqLocale.map((f) => ({ q: f.q, a: texteOffre(f.a) }))} />
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://coverswap.fr" },
          { name: "Zones d'intervention", url: "https://coverswap.fr/zones" },
          { name: `Covering ${zone.ville}`, url },
        ]}
      />

      {/* ══════════════════ OUVERTURE ══════════════════ */}
      <section className="bg-fond-2 px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Zones d'intervention", href: "/zones" }, { label: `Covering ${zone.ville}` }]} />
          <p className="surtitre">Zone d&apos;intervention · {zone.codePostal.split(" / ")[0]}</p>
          <h1 className="titre-1 mt-2 max-w-4xl text-encre">Covering adhésif à {zone.ville} — Cuisine, salle de bain, meubles : rénovés en 1 journée</h1>
          <p className="texte mt-4 mb-8 max-w-3xl text-encre-2">
            Vous habitez {zone.ville} et souhaitez moderniser votre cuisine, salle de bain ou vos meubles sans
            engager de gros travaux&nbsp;? Nous intervenons à {zone.ville} et dans toute la métropole avec le covering
            adhésif Cover Styl&apos;&nbsp;: pose en 1 journée, {NB_REFERENCES} références au catalogue, garanti 10 ans.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Lien href="/simulateur">Simuler mon projet ({zone.ville})</Lien>
            <Lien href="/contact" variante="secondaire">
              Devis gratuit {DELAI_REPONSE}
            </Lien>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-encre-2">
            <li>{zone.distanceKm === 0 ? "Basés à Pérols, chez vous" : `Basés à Pérols, à ${zone.distanceKm} km`}</li>
            <li>Devis {DELAI_REPONSE}</li>
            <li>Garanti 10 ans Cover Styl&apos;</li>
          </ul>
        </div>
      </section>

      {/* ══════════════════ INTRO + QUARTIERS ══════════════════ */}
      <Section titre={`Le covering Cover Styl' à ${zone.ville}`}>
        <div className="texte space-y-5 text-encre-2">
          {texteOffre(zone.intro)
            .split(/\n+/)
            .filter(Boolean)
            .map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
        </div>

        <div className={`${CARTE} mt-10 p-6 md:p-8`}>
          <h3 className="mb-4 text-[17px] font-semibold text-encre">Quartiers et secteurs couverts à {zone.ville}</h3>
          <ul className="flex flex-wrap gap-2">
            {zone.quartiers.map((q) => (
              <li key={q} className="rounded-full border border-trait bg-fond px-3 py-1.5 text-[14px] text-encre">
                {q}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] text-encre-2">
            Votre quartier ne figure pas dans la liste&nbsp;? Nous intervenons sur l&apos;ensemble du territoire
            de {zone.ville} et de ses communes voisines. Contactez-nous pour confirmer.
          </p>
        </div>
      </Section>

      {/* ══════════════════ NOS PRESTATIONS DANS LA VILLE ══════════════════ */}
      <Section large fond="fond-2" titre={`Nos prestations covering à ${zone.ville}`} intro="Toute la palette du covering Cover Styl' disponible chez vous, en un seul jour de pose.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {prestationsVille.map((p) => (
            <Link key={p.href} href={p.href} className={`${CARTE} block h-full p-6 transition-colors duration-[var(--duree-courte)] hover:border-encre`}>
              <h3 className="mb-2 text-[17px] font-semibold text-encre">{p.title}</h3>
              <p className="texte-2">{p.desc}</p>
              <span className="mt-4 inline-flex text-[15px] font-medium text-encre underline underline-offset-4">Découvrir</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ══════════════════ POURQUOI COVERSWAP À [VILLE] ══════════════════ */}
      <Section large titre={`Pourquoi choisir CoverSwap à ${zone.ville} ?`}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="texte space-y-5 text-encre-2">
            <p>{texteOffre(zone.pourquoi)}</p>
            <p>
              <strong className="text-encre">Type d&apos;habitat couvert à {zone.ville}&nbsp;:</strong> {zone.habitat}.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {[
              { value: `${zone.distanceKm === 0 ? "Sur place" : zone.distanceKm + " km"}`, label: "depuis Pérols" },
              { value: `${DELAI_REPONSE_COURT}`, label: "pour un devis" },
              { value: "1 jour", label: "de pose typique" },
              { value: `${GARANTIE}`, label: "garanti Cover Styl'" },
            ].map((stat) => (
              <div key={stat.label} className={`${CARTE} flex flex-col-reverse p-6 text-center`}>
                <dt className="text-[14px] text-encre-2">{stat.label}</dt>
                <dd className="mb-1 font-display text-[24px] font-semibold text-encre">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* ══════════════════ FAQ LOCALE ══════════════════ */}
      <Section fond="fond-2" titre={`Questions fréquentes — ${zone.ville}`}>
        <div className="space-y-2.5">
          {zone.faqLocale.map((faq) => (
            <details key={faq.q} className={`group ${CARTE} p-4`}>
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-encre">
                {faq.q}
                <span aria-hidden className="text-2xl leading-none text-encre-2 transition-transform duration-[var(--duree-courte)] group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="texte-2 mt-3">{texteOffre(faq.a)}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ══════════════════ AUTRES ZONES (maillage interne) ══════════════════ */}
      <Section large titre="Autres zones d'intervention CoverSwap" intro={`Nous intervenons aussi dans ces villes proches de ${zone.ville} et partout en Hérault & Occitanie.`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {otherZones.map((z) => (
            <Link key={z.slug} href={`/zones/${getZoneSlug(z)}`} className={`${CARTE} block p-4 text-center transition-colors duration-[var(--duree-courte)] hover:border-encre`}>
              <span className="block text-[15px] font-medium text-encre">Covering {z.ville}</span>
              <span className="text-[13px] text-encre-2">{z.codePostal.split(" / ")[0]}</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* ══════════════════ DERNIER APPEL ══════════════════ */}
      <Section
        fond="fond-2"
        titre={`Votre projet covering à ${zone.ville} commence ici`}
        intro={`Envoyez-nous une photo, recevez un rendu IA en ${DELAI_RENDU} et un devis détaillé ${DELAI_REPONSE}. Sans engagement, sans visite obligatoire.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Lien href="/simulateur">Simuler mon projet</Lien>
          <Lien href={ENTREPRISE.reseaux.whatsapp} target="_blank" rel="noopener noreferrer" variante="secondaire">
            WhatsApp direct
          </Lien>
        </div>
      </Section>
    </div>
  );
}
