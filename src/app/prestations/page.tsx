import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { PRESTATIONS, lienPrestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, GARANTIE_ANS, PRIX_PLAGE } from "@/lib/offre";

export const metadata: Metadata = {
  title: { absolute: "Prestations de covering adhésif — cuisine, salle de bain, meubles, pro, vitrages | CoverSwap" },
  description: `Ce que CoverSwap recouvre et comment : cuisines, salles de bain, meubles, locaux professionnels, vitrages. Films Cover Styl', pose en une journée, ${PRIX_PLAGE} fourni et posé selon la complexité de la pose, garantie ${GARANTIE_ANS} ans.`,
  alternates: { canonical: `${ENTREPRISE.site}/prestations` },
};

export default function PagePrestations() {
  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Prestations", url: `${ENTREPRISE.site}/prestations` }]} />
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Prestations" }]} />
          <h1 className="titre-1 max-w-3xl text-encre">Ce que nous recouvrons</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">
            Un film adhésif Cover Styl&apos; posé à chaud sur vos surfaces existantes : la pièce change de style en une journée, sans démontage ni gravats, et le film se retire sans trace. Tarif au mètre linéaire, {PRIX_PLAGE} fourni et posé : le chiffre se détermine au devis selon la complexité de la pose. Devis gratuit {DELAI_REPONSE}.
          </p>
        </div>
      </section>

      <Section large>
        <div className="grid gap-5 md:grid-cols-2">
          {PRESTATIONS.map((p) => (
            <Link key={p.slug} href={lienPrestation(p.slug)} className="group rounded-[var(--rayon-md)] border border-trait bg-white p-7 transition-colors duration-[var(--duree-courte)] hover:border-encre">
              <p className="surtitre mb-2">{p.court}</p>
              <h2 className="titre-2 mb-3 text-encre">{p.h1}</h2>
              <p className="texte-2 mb-4">{p.accroche}</p>
              <p className="text-[14px] text-encre-2">
                {p.prix.fourchette === "sur devis" ? "Sur devis" : `Ordre de grandeur : ${p.prix.fourchette}`} · <span className="text-encre underline-offset-4 group-hover:underline">Voir la prestation</span>
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <Section titre="Un doute sur ce qui est possible chez vous ?" intro={`Envoyez des photos : nous vous disons ce qui se recouvre, ce qui ne se recouvre pas, et à quel prix, ${DELAI_REPONSE}.`} fond="fond-2">
        <Lien href="/contact">Envoyer mes photos</Lien>
      </Section>
    </div>
  );
}
