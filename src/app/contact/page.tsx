import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE } from "@/lib/offre";
import FormulaireContact from "./_components/FormulaireContact";
import { chargerPrestations } from "@/lib/prestations";

export const metadata: Metadata = {
  title: "Contact — Devis gratuit covering adhésif",
  description: `Contactez CoverSwap pour un devis gratuit de covering adhésif. Rénovation cuisine, salle de bain, meubles et locaux pro. Réponse ${DELAI_REPONSE}.`,
  keywords: "contact coverswap, devis covering, demande devis rénovation adhésive, covering montpellier contact",
  alternates: { canonical: "https://coverswap.fr/contact" },
  openGraph: {
    title: "Contact CoverSwap — Devis gratuit covering adhésif",
    description: `Contactez-nous pour un devis gratuit de covering adhésif. Réponse ${DELAI_REPONSE}.`,
    url: "https://coverswap.fr/contact",
    siteName: "CoverSwap",
    locale: "fr_FR",
    type: "website",
  },
};

const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white p-6";

export default async function ContactPage() {
  const familles = await chargerPrestations();
  return (
    <div className="bg-fond px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
      <BreadcrumbSchema items={[{ name: "Accueil", url: "https://coverswap.fr" }, { name: "Contact", url: "https://coverswap.fr/contact" }]} />
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="surtitre">Contact</p>
          <h1 className="titre-1 mt-2 text-encre">Demandez votre devis gratuit</h1>
          <p className="texte mt-4 text-encre-2">Décrivez votre projet et recevez une estimation personnalisée {DELAI_REPONSE}.</p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[1fr_380px]">
          <FormulaireContact familles={familles} />

          <div className="space-y-6">
            <div className={`${CARTE} space-y-2`}>
              <h2 className="mb-2 text-[17px] font-semibold text-encre">Nos coordonnées</h2>
              <a href={`mailto:${ENTREPRISE.email}`} className="flex min-h-[44px] items-center justify-between gap-3">
                <span className="text-[14px] text-encre-2">E-mail</span>
                <span className="text-[15px] font-medium text-encre">{ENTREPRISE.email}</span>
              </a>
              <a href={`tel:${ENTREPRISE.telephoneInternational}`} className="flex min-h-[44px] items-center justify-between gap-3">
                <span className="text-[14px] text-encre-2">Téléphone</span>
                <span className="text-[15px] font-medium text-encre">{ENTREPRISE.telephone}</span>
              </a>
            </div>

            <div className={CARTE}>
              <h2 className="mb-3 text-[17px] font-semibold text-encre">Horaires</h2>
              <dl className="space-y-2 text-[14.5px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-encre-2">{ENTREPRISE.horaires.jours}</dt>
                  <dd className="font-medium text-encre">{ENTREPRISE.horaires.heures}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-encre-2">Samedi – dimanche</dt>
                  <dd className="text-encre-2">Fermé</dd>
                </div>
              </dl>
            </div>

            <div className={CARTE}>
              <h2 className="mb-2 text-[17px] font-semibold text-encre">Intervention France entière</h2>
              <p className="texte-2">Nous nous déplaçons partout en France métropolitaine.</p>
            </div>

            <div id="espace" className={`${CARTE} scroll-mt-20`}>
              <h2 className="mb-2 text-[17px] font-semibold text-encre">Votre espace client</h2>
              <p className="texte-2">
                Votre lien d&apos;accès vous a été envoyé par SMS ou e-mail. Vous ne le retrouvez pas ? Demandez-le avec le formulaire ou au{" "}
                <a href={`tel:${ENTREPRISE.telephoneInternational}`} className="whitespace-nowrap text-encre underline underline-offset-4">
                  {ENTREPRISE.telephone}
                </a>
                .
              </p>
            </div>

            <div className={CARTE}>
              <p className="texte-2 mb-4">Besoin d&apos;un aperçu immédiat de votre projet ?</p>
              <Lien href="/simulateur" variante="secondaire" plein>
                Simuler mon projet
              </Lien>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
