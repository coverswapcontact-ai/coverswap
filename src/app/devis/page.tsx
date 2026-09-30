import type { Metadata } from "next";
import DevisForm from "@/components/DevisForm";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { ENTREPRISE } from "@/lib/entreprise";
import { chargerPrestations } from "@/lib/prestations";
import { BreadcrumbSchema } from "@/components/JsonLd";

import { DELAI_RENDU, DELAI_REPONSE } from "@/lib/offre";
export const metadata: Metadata = {
  title: { absolute: `Devis Covering en Ligne Gratuit — Réponse ${DELAI_REPONSE} | CoverSwap` },
  description:
    `Demandez votre devis covering en ligne gratuit et sans engagement. Cuisine, salle de bain, meubles, pro à Montpellier, Pérols et partout en France. Joignez vos photos, réponse personnalisée ${DELAI_REPONSE}.`,
  keywords:
    "devis covering en ligne, devis covering gratuit, devis rénovation cuisine, devis covering Montpellier, estimation covering adhésif, prix covering Hérault",
  alternates: { canonical: "https://coverswap.fr/devis" },
  openGraph: {
    title: `Devis Covering en Ligne Gratuit — Réponse ${DELAI_REPONSE} | CoverSwap`,
    description:
      `Devis covering gratuit et sans engagement. Réponse personnalisée ${DELAI_REPONSE}. Montpellier, Pérols et France entière.`,
    url: "https://coverswap.fr/devis",
    type: "website",
    siteName: "CoverSwap",
    locale: "fr_FR",
    images: [{ url: "https://coverswap.fr/og-image.jpg", width: 1200, height: 630, alt: "Devis covering en ligne gratuit — CoverSwap" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Devis Covering en Ligne Gratuit — Réponse ${DELAI_REPONSE}`,
    description: `Devis covering gratuit et sans engagement, réponse ${DELAI_REPONSE}.`,
    images: ["https://coverswap.fr/og-image.jpg"],
  },
};

const avantages = [
  { title: `Réponse ${DELAI_REPONSE}`, desc: "Devis détaillé et personnalisé par email." },
  { title: "100 % gratuit", desc: "Sans engagement, sans frais cachés." },
  { title: "Devis détaillé", desc: "Fourniture + pose incluses, un prix clair et sans surprise." },
  { title: "France entière", desc: "Intervention partout en France métropolitaine." },
];

const etapes = [
  { num: "1", title: "Décrivez votre projet", desc: "Type de surface, dimensions approximatives, style souhaité." },
  { num: "2", title: "On étudie votre demande", desc: "Chiffrage au mètre linéaire selon la complexité de la pose : découpes, accès, état du support, métrage." },
  { num: "3", title: "Vous recevez votre devis", desc: `Détaillé, gratuit, ${DELAI_REPONSE}. Vous décidez ensuite.` },
];

const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white";

export default async function DevisPage() {
  const familles = await chargerPrestations();
  return (
    <div className="bg-fond">
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: "https://coverswap.fr" },
          { name: "Devis en ligne", url: "https://coverswap.fr/devis" },
        ]}
      />

      {/* OUVERTURE */}
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-3xl">
          <p className="surtitre">Devis gratuit · réponse {DELAI_REPONSE}</p>
          <h1 className="titre-1 mt-2 text-encre">Votre devis covering en ligne, gratuit</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">
            Cuisine, salle de bain, meubles ou local pro : décrivez votre projet, joignez quelques
            photos et recevez une estimation personnalisée {DELAI_REPONSE}. Sans engagement.
          </p>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="px-4 pt-8 md:px-6">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-3 lg:grid-cols-4">
          {avantages.map((a) => (
            <li key={a.title} className={`${CARTE} h-full p-5`}>
              <h2 className="mb-1 text-[15px] font-semibold text-encre">{a.title}</h2>
              <p className="text-[14px] leading-relaxed text-encre-2">{a.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* FORMULAIRE + COLONNE */}
      <Section large>
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h2 className="titre-2 mb-6 text-encre">Décrivez votre projet</h2>
            <DevisForm source="coverswap.fr/devis" submitLabel="Recevoir mon devis gratuit" familles={familles} />
          </div>

          <div className="space-y-6">
            <div className={`${CARTE} p-6`}>
              <h3 className="mb-5 text-[17px] font-semibold text-encre">Comment ça marche</h3>
              <ol className="space-y-5">
                {etapes.map((e) => (
                  <li key={e.num} className="flex gap-3">
                    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-encre font-display text-[14px] font-semibold text-encre">
                      {e.num}
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-encre">{e.title}</p>
                      <p className="mt-0.5 text-[14px] leading-relaxed text-encre-2">{e.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={`${CARTE} space-y-2 p-6`}>
              <h3 className="text-[17px] font-semibold text-encre">Ou contactez-nous directement</h3>
              <a href={`tel:${ENTREPRISE.telephoneInternational}`} className="flex min-h-[44px] items-center justify-between gap-3 text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre">
                <span className="text-[14px]">Téléphone</span>
                <span className="text-[15px] font-medium text-encre">{ENTREPRISE.telephone}</span>
              </a>
              <a href={ENTREPRISE.reseaux.whatsapp} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center justify-between gap-3 text-encre-2 transition-colors duration-[var(--duree-courte)] hover:text-encre">
                <span className="text-[14px]">WhatsApp</span>
                <span className="text-[15px] font-medium text-encre">Réponse rapide</span>
              </a>
            </div>

            <div className={`${CARTE} p-6`}>
              <p className="texte-2 mb-4">Envie de visualiser le rendu avant de vous décider ?</p>
              <Lien href="/simulateur" variante="secondaire" plein>
                Simuler mon projet ({DELAI_RENDU})
              </Lien>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
