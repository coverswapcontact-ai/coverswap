import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { FAQSchema, ServiceSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { descriptionVille, titreVille } from "../textes-seo";
import { ZONES, getZoneSlug, getZoneBySlug } from "@/data/zones";
import { DELAI_RENDU, DELAI_REPONSE, DELAI_REPONSE_COURT, DUREE_POSE, GARANTIE, NB_REFERENCES, texteOffre } from "@/lib/offre";

/**
 * Les pages locales (8 villes, mission 16, partie 5) : adresses et textes conservés, thème clair, bouton principal
 * « Simuler ma cuisine ». Balisage : un `Service` par ville (`areaServed` : la ville ; `provider` : l'entreprise par son
 * `@id`, déclarée une fois dans le gabarit) — plus de seconde fiche `LocalBusiness` par ville (nom et coordonnées de
 * centre-ville concurrents de la vraie fiche). Délais, garantie, durée : `offre.ts`.
 */

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

  return {
    ...metadonneesPage({
      titre: titreVille(zone.ville),
      description: descriptionVille(zone.ville, zone.codePostal),
      chemin: `/zones/${getZoneSlug(zone)}`,
    }),
    keywords: `covering ${zone.ville}, rénovation cuisine ${zone.ville}, covering adhésif ${zone.ville}, relooking meubles ${zone.ville}, film adhésif ${zone.ville}, Cover Styl ${zone.ville}, covering Hérault, covering Occitanie`,
    robots: { index: true, follow: true },
  };
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
  const url = `${ENTREPRISE.site}/zones/${getZoneSlug(zone)}`;

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
      <ServiceSchema
        name={`Covering adhésif à ${zone.ville}`}
        description={`Rénovation par revêtement adhésif Cover Styl' à ${zone.ville} : cuisines, salles de bain, meubles, surfaces professionnelles. Pose en ${DUREE_POSE}, ${NB_REFERENCES} références disponibles.`}
        url={url}
        zone={{ "@type": "City", name: zone.ville }}
      />
      <FAQSchema faqs={zone.faqLocale.map((f) => ({ q: f.q, a: texteOffre(f.a) }))} />

      {/* ══════════════════ OUVERTURE ══════════════════ */}
      <section className="bg-fond-2 px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Zones d'intervention", href: "/zones" }, { label: `Covering ${zone.ville}`, href: `/zones/${getZoneSlug(zone)}` }]} />
          <p className="surtitre">Zone d&apos;intervention · {zone.codePostal.split(" / ")[0]}</p>
          <h1 className="titre-1 mt-2 max-w-4xl text-encre">Covering adhésif à {zone.ville} — Cuisine, salle de bain, meubles : rénovés en {DUREE_POSE}</h1>
          <p className="texte mt-4 mb-8 max-w-3xl text-encre-2">
            Vous habitez {zone.ville} et souhaitez moderniser votre cuisine, salle de bain ou vos meubles sans
            engager de gros travaux&nbsp;? Nous intervenons à {zone.ville} et dans toute la métropole avec le covering
            adhésif Cover Styl&apos;&nbsp;: pose en {DUREE_POSE}, {NB_REFERENCES} références au catalogue, garanti {GARANTIE}.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Lien href="/simulateur?projet=cuisine">Simuler ma cuisine</Lien>
            <Lien href="/contact" variante="secondaire">
              Devis gratuit {DELAI_REPONSE}
            </Lien>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-encre-2">
            <li>{zone.distanceKm === 0 ? "Basés à Pérols, chez vous" : `Basés à Pérols, à ${zone.distanceKm} km`}</li>
            <li>Devis {DELAI_REPONSE}</li>
            <li>Garanti {GARANTIE} Cover Styl&apos;</li>
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
              { value: DUREE_POSE, label: "de pose typique" },
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
          <Lien href="/simulateur?projet=cuisine">Simuler ma cuisine</Lien>
          <Lien href={ENTREPRISE.reseaux.whatsapp} target="_blank" rel="noopener noreferrer" variante="secondaire">
            WhatsApp direct
          </Lien>
        </div>
      </Section>
    </div>
  );
}
