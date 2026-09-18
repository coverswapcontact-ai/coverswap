import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { PRESTATIONS } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, GARANTIE_ANS, PRIX_PLAGE } from "@/lib/offre";

export const metadata: Metadata = {
  title: { absolute: "Prestations de covering adhésif — cuisine, salle de bain, meubles, pro, vitrages | CoverSwap" },
  description: `Ce que CoverSwap recouvre et comment : cuisines, salles de bain, meubles, locaux professionnels, vitrages. Films Cover Styl', pose en une journée, ${PRIX_PLAGE} fourni et posé selon la complexité de la pose, garantie ${GARANTIE_ANS} ans.`,
  alternates: { canonical: `${ENTREPRISE.site}/prestations` },
};

export default function PagePrestations() {
  return (
    <main className="bg-noir min-h-screen">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Prestations", url: `${ENTREPRISE.site}/prestations` }]} />
      <section className="pt-32 pb-10 md:pt-40 px-4 sm:px-6 lg:px-8">
        <div className="container-custom">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Prestations" }]} />
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 max-w-3xl text-balance">Ce que nous recouvrons</h1>
          <p className="text-gris-300 text-lg max-w-2xl leading-relaxed">
            Un film adhésif Cover Styl&apos; posé à chaud sur vos surfaces existantes : la pièce change de style en une journée, sans démontage ni gravats, et le film se retire sans trace. Tarif au mètre linéaire, {PRIX_PLAGE} fourni et posé : le chiffre se détermine au devis selon la complexité de la pose. Devis gratuit {DELAI_REPONSE}.
          </p>
        </div>
      </section>

      <section className="section-padding pt-6">
        <div className="container-custom grid md:grid-cols-2 gap-5">
          {PRESTATIONS.map((p) => (
            <Link key={p.slug} href={`/prestations/${p.slug}`} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 hover:border-rouge/50 transition-colors">
              <p className="text-rouge text-xs font-bold uppercase tracking-widest mb-2">{p.court}</p>
              <h2 className="font-display text-2xl font-bold mb-3 group-hover:text-white">{p.h1}</h2>
              <p className="text-gris-400 leading-relaxed mb-4">{p.accroche}</p>
              <p className="text-sm text-gris-500">
                {p.prix.fourchette === "sur devis" ? "Sur devis" : `Ordre de grandeur : ${p.prix.fourchette}`} · <span className="text-white group-hover:underline">Voir la prestation →</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="container-custom rounded-3xl bg-rouge/10 border border-rouge/30 p-8 md:p-12 text-center">
          <h2 className="font-display text-3xl font-bold mb-3">Un doute sur ce qui est possible chez vous ?</h2>
          <p className="text-gris-300 max-w-xl mx-auto mb-6">Envoyez des photos : nous vous disons ce qui se recouvre, ce qui ne se recouvre pas, et à quel prix, {DELAI_REPONSE}.</p>
          <Link href="/devis" className="btn-primary">
            Envoyer mes photos
          </Link>
        </div>
      </section>
    </main>
  );
}
