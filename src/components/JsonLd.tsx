import { ENTREPRISE } from "@/lib/entreprise";
import { ZONES } from "@/data/zones";
import { GARANTIE_ANS, PRIX_ML_MIN, PRIX_ML_MAX } from "@/lib/offre";
import { Script } from "./ScriptJsonLd";
import { IMAGE_PARTAGE } from "@/lib/partage";

/**
 * Balisage schema.org, écrit à la main depuis la source unique (lib/entreprise,
 * lib/offre, data/zones) : LocalBusiness, Organization, Service, FAQPage,
 * HowTo, Article, BreadcrumbList, ImageObject. Aucune valeur en dur ici.
 *
 * Site 3.0 (lot F4) : UNE entreprise locale (`LOCAL_BUSINESS`, posée par le gabarit, jamais par une page) ; un
 * `Service` par prestation avec son `@id` et son image ; le `BreadcrumbList` posé par le fil d'Ariane visible lui-même
 * (`Breadcrumb.tsx`, une seule liste pour les deux) ; un `ImageObject` par avant / après rendu (`imageObjet`), légendé,
 * avec un `creditText` honnête sur les images d'ambiance.
 */
export { DonneesStructurees } from "./ScriptJsonLd";
export { CREDIT_AMBIANCE, adresseImage, imageObjet, legendeAmbiance, refImage } from "@/lib/donnees-images";

const ADRESSE = {
  "@type": "PostalAddress",
  streetAddress: ENTREPRISE.adresse.rue,
  addressLocality: ENTREPRISE.adresse.ville,
  postalCode: ENTREPRISE.adresse.codePostal,
  addressRegion: ENTREPRISE.adresse.region,
  addressCountry: "FR",
};

export const LOCAL_BUSINESS_ID = `${ENTREPRISE.site}/#entreprise`;

export const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": LOCAL_BUSINESS_ID,
  name: ENTREPRISE.nom,
  legalName: `${ENTREPRISE.dirigeant} — ${ENTREPRISE.nom}`,
  founder: { "@type": "Person", name: ENTREPRISE.dirigeant },
  description: `Rénovation intérieure par covering adhésif Cover Styl' : cuisines, salles de bain, meubles, locaux professionnels et vitrages. Pose en une journée, film réversible, garanti ${GARANTIE_ANS} ans, simulation sur photo. Montpellier, Hérault et France métropolitaine sur devis.`,
  url: ENTREPRISE.site,
  telephone: ENTREPRISE.telephoneInternational,
  email: ENTREPRISE.email,
  priceRange: `${PRIX_ML_MIN}-${PRIX_ML_MAX} €/ml`,
  currenciesAccepted: "EUR",
  paymentAccepted: "Virement, chèque, espèces",
  slogan: "Rénover sans casser",
  image: [IMAGE_PARTAGE.url],
  logo: `${ENTREPRISE.site}/logo.png`,
  address: ADRESSE,
  geo: { "@type": "GeoCoordinates", latitude: ENTREPRISE.geo.lat, longitude: ENTREPRISE.geo.lng },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", opens: ENTREPRISE.horaires.ouverture, closes: ENTREPRISE.horaires.fermeture, dayOfWeek: ENTREPRISE.horaires.joursIso },
  ],
  areaServed: [
    ...ZONES.map((zone) => ({ "@type": "City", name: zone.ville })),
    { "@type": "AdministrativeArea", name: ENTREPRISE.zone.departement },
    { "@type": "AdministrativeArea", name: ENTREPRISE.adresse.region },
    { "@type": "Country", name: "France" },
  ],
  knowsAbout: ["Covering adhésif", "Films Cover Styl'", "Rénovation de cuisine sans travaux", "Rénovation de salle de bain sans casser le carrelage", "Relooking de meubles", "Films pour vitrages"],
  sameAs: [ENTREPRISE.reseaux.instagram, ENTREPRISE.reseaux.facebook, ENTREPRISE.reseaux.tiktok],
};

export function LocalBusinessSchema() {
  return <Script data={LOCAL_BUSINESS} />;
}

export function OrganizationSchema() {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${ENTREPRISE.site}/#organisation`,
        name: ENTREPRISE.nom,
        url: ENTREPRISE.site,
        logo: { "@type": "ImageObject", url: `${ENTREPRISE.site}/logo.png` },
        contactPoint: [{ "@type": "ContactPoint", telephone: ENTREPRISE.telephoneInternational, email: ENTREPRISE.email, contactType: "customer service", availableLanguage: "French", areaServed: "FR" }],
        sameAs: LOCAL_BUSINESS.sameAs,
      }}
    />
  );
}

/**
 * `urlOffre` (mission 16, partie 3) : l'adresse de l'offre ; le tunnel commence au simulateur (mission 16, partie 4 :
 * `/devis` y est redirigé), /pro passe son formulaire.
 * `zone` (mission 16, partie 5) : la zone desservie quand le service est local (une page de ville : la ville) ; le
 * prestataire reste l'entreprise (`@id`), jamais une seconde fiche `LocalBusiness`.
 */
/** L'`@id` d'un service : l'adresse de sa page, suivie de `#service` (`https://coverswap.fr/#service` pour l'accueil). */
export const idService = (url: string) => `${url === ENTREPRISE.site ? `${url}/` : url}#service`;

/**
 * Site 3.0 (lot F4) : `@id` (`idService`) et `image` (une référence `{ "@id" }` à l'`ImageObject` de l'avant / après
 * de la page, `imageObjet`) sont posés juste après `@type`.
 */
export function ServiceSchema({ name, description, url, typeProjet, urlOffre = `${ENTREPRISE.site}/simulateur`, zone, image }: { name: string; description: string; url: string; typeProjet?: string; urlOffre?: string; zone?: Record<string, unknown>; image?: Record<string, unknown> | null }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": idService(url),
        ...(image ? { image } : {}),
        name,
        description,
        url,
        serviceType: typeProjet ? `Covering adhésif — ${typeProjet}` : "Rénovation par covering adhésif",
        provider: { "@id": LOCAL_BUSINESS_ID },
        areaServed: zone ?? LOCAL_BUSINESS.areaServed,
        offers: {
          "@type": "Offer",
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "EUR",
            minPrice: PRIX_ML_MIN,
            maxPrice: PRIX_ML_MAX,
            unitText: "mètre linéaire de film posé, fourni et posé",
          },
          availability: "https://schema.org/InStock",
          url: urlOffre,
        },
      }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }}
    />
  );
}

export function HowToSchema({ name, description, etapes, dureeTotale }: { name: string; description: string; etapes: { titre: string; texte: string }[]; dureeTotale?: string }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        description,
        ...(dureeTotale ? { totalTime: dureeTotale } : {}),
        step: etapes.map((e, i) => ({ "@type": "HowToStep", position: i + 1, name: e.titre, text: e.texte })),
      }}
    />
  );
}

export function ArticleSchema({ title, description, url, image, datePublished, dateModified }: { title: string; description: string; url: string; image?: string; datePublished: string; dateModified?: string }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        ...(image ? { image: [image] } : {}),
        datePublished,
        dateModified: dateModified ?? datePublished,
        inLanguage: "fr-FR",
        author: [{ "@type": "Person", name: ENTREPRISE.dirigeant, url: ENTREPRISE.site }],
        publisher: { "@id": `${ENTREPRISE.site}/#organisation` },
      }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
      }}
    />
  );
}
