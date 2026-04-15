import {
  LocalBusinessJsonLd,
  FAQJsonLd,
  ArticleJsonLd,
  OrganizationJsonLd,
  BreadcrumbJsonLd,
} from "next-seo";

/* ──────────────────────────────────────────────────────────────────
   LOCAL BUSINESS — schema.org/LocalBusiness
   Utilisé dans layout.tsx (site-wide)
────────────────────────────────────────────────────────────────── */
export function LocalBusinessSchema() {
  return (
    <LocalBusinessJsonLd
      scriptKey="coverswap-local-business"
      type="HomeAndConstructionBusiness"
      name="CoverSwap"
      description="Rénovation intérieure par revêtements adhésifs texturés. Covering cuisine, salle de bain, meubles et surfaces professionnelles. Intervention France entière."
      url="https://coverswap.fr"
      telephone="+33670352869"
      address={{
        streetAddress: "73 rue Simone Veil",
        addressLocality: "Pérols",
        postalCode: "34470",
        addressCountry: "FR",
      }}
      geo={{
        latitude: 43.5275,
        longitude: 3.9528,
      }}
      image={["https://coverswap.fr/og-image.jpg"]}
      openingHoursSpecification={[
        {
          opens: "08:00",
          closes: "17:00",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        },
      ]}
      priceRange="€€"
      areaServed={["France"]}
      email="coverswap.contact@gmail.com"
      slogan="Rénovation adhésive premium"
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
          email: "coverswap.contact@gmail.com",
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
