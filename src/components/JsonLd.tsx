import {
  FAQJsonLd,
  OrganizationJsonLd,
  BreadcrumbJsonLd,
} from "next-seo";

/* ──────────────────────────────────────────────────────────────────
   LOCAL BUSINESS — schema.org/HomeAndConstructionBusiness
   Utilisé dans layout.tsx (site-wide).
   Custom JSON-LD car next-seo ne supporte pas areaServed avec
   un mix City + AdministrativeArea + Country (objet structuré).
────────────────────────────────────────────────────────────────── */
const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": "https://coverswap.fr",
  name: "CoverSwap",
  description:
    "Rénovation intérieure par revêtements adhésifs Cover Styl'. Covering cuisine, salle de bain, meubles, vitrages et surfaces professionnelles. Pose en 1 journée, garantie 10 ans, simulation IA gratuite. Intervention Montpellier, Pérols, Hérault, Occitanie et France entière.",
  url: "https://coverswap.fr",
  telephone: "+33670352869",
  email: "contact@coverswap.fr",
  priceRange: "€€",
  slogan: "Rénovation adhésive premium",
  image: ["https://coverswap.fr/og-image.jpg"],
  logo: "https://coverswap.fr/logo.png",
  address: {
    "@type": "PostalAddress",
    streetAddress: "73 rue Simone Veil",
    addressLocality: "Pérols",
    postalCode: "34470",
    addressRegion: "Occitanie",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.5275,
    longitude: 3.9528,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      opens: "08:00",
      closes: "17:00",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
  ],
  areaServed: [
    { "@type": "City", name: "Montpellier" },
    { "@type": "City", name: "Pérols" },
    { "@type": "City", name: "Lattes" },
    { "@type": "City", name: "Mauguio" },
    { "@type": "City", name: "Castelnau-le-Lez" },
    { "@type": "City", name: "Béziers" },
    { "@type": "City", name: "Nîmes" },
    { "@type": "City", name: "Sète" },
    { "@type": "AdministrativeArea", name: "Hérault" },
    { "@type": "AdministrativeArea", name: "Occitanie" },
    { "@type": "Country", name: "France" },
  ],
  sameAs: [
    "https://www.instagram.com/cover.swap/",
    "https://www.facebook.com/coverswap",
    "https://www.tiktok.com/@cover.swap",
    "https://www.linkedin.com/company/coverswap",
  ],
};

export function LocalBusinessSchema() {
  return (
    <script
      type="application/ld+json"
      id="coverswap-local-business"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────
   ORGANIZATION — schema.org/Organization
   Complément à LocalBusiness
────────────────────────────────────────────────────────────────── */
export function OrganizationSchema() {
  return (
    <OrganizationJsonLd
      scriptKey="coverswap-org"
      type="Organization"
      name="CoverSwap"
      url="https://coverswap.fr"
      logo="https://coverswap.fr/logo.png"
      contactPoint={[
        {
          telephone: "+33670352869",
          contactType: "customer service",
          email: "contact@coverswap.fr",
        },
      ]}
      legalName="CoverSwap - Lucas Villemin"
      address={{
        streetAddress: "73 rue Simone Veil",
        addressLocality: "Pérols",
        postalCode: "34470",
        addressCountry: "FR",
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────
   SERVICE — schema.org/Service (custom car next-seo n'a pas de ServiceJsonLd)
────────────────────────────────────────────────────────────────── */
export function ServiceSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
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
      "@type": "Country",
      name: "France",
    },
    serviceType: "Rénovation par covering adhésif",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────
   FAQ — schema.org/FAQPage via next-seo
────────────────────────────────────────────────────────────────── */
export function FAQSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <FAQJsonLd
      scriptKey="faq-schema"
      questions={faqs.map((faq) => ({
        question: faq.q,
        answer: faq.a,
      }))}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────
   ARTICLE — schema.org/Article via next-seo
────────────────────────────────────────────────────────────────── */
export function ArticleSchema({
  title,
  description,
  datePublished,
  url,
  images,
}: {
  title: string;
  description: string;
  datePublished: string;
  url: string;
  images?: string[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished,
    dateModified: datePublished,
    author: [{ "@type": "Person", name: "Lucas Villemin", url: "https://coverswap.fr" }],
    publisher: {
      "@type": "Organization",
      name: "CoverSwap",
      logo: { "@type": "ImageObject", url: "https://coverswap.fr/logo.png" },
    },
    image: images || ["https://coverswap.fr/og-image.jpg"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────
   BREADCRUMB — schema.org/BreadcrumbList via next-seo
────────────────────────────────────────────────────────────────── */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <BreadcrumbJsonLd
      scriptKey="breadcrumb-schema"
      items={items.map((i) => ({
        name: i.name,
        item: i.url,
      }))}
    />
  );
}
