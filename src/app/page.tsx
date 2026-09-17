import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";
import HeroVideo from "@/components/HeroVideo";
import { SimulationSection } from "@/components/HomeClient";
import { FAQSchema } from "@/components/JsonLd";
import { PRESTATIONS } from "@/data/prestations";
import { FAQ_GENERALE } from "@/data/faq";
import { ZONES, getZoneSlug } from "@/data/zones";
import revetements from "@/data/revetements.json";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, FOURCHETTES, GARANTIE_ANS, NB_REFERENCES, PRIX_ML_MIN, PRIX_PLAGE, euros, fourchette } from "@/lib/offre";

export const metadata: Metadata = {
  title: { absolute: "CoverSwap — Rénover sans casser : covering adhésif à Montpellier" },
  description: `Cuisines, salles de bain, meubles et locaux professionnels recouverts d'un film Cover Styl' en une journée, sans travaux. Simulation sur votre photo, devis ${DELAI_REPONSE}, ${PRIX_PLAGE} fourni et posé, garantie ${GARANTIE_ANS} ans. Montpellier, Hérault, France sur devis.`,
  alternates: { canonical: ENTREPRISE.site },
};

/* ── Familles du catalogue : comptées dans les données, une référence témoin par famille ── */
const TEMOINS: Record<string, { nom: string; ref: string; image: string }> = {
  bois: { nom: "Bois", ref: "Rich Oak", image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/aa04_d4dbfa3468.jpg" },
  pierre: { nom: "Pierre & marbre", ref: "Grigio Marquina", image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/mk14_792e853256.jpg" },
  beton: { nom: "Béton", ref: "Raw Grey", image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/ne24_50d2ddfad4.jpg" },
  couleur: { nom: "Couleurs unies", ref: "Black Mat", image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/k1_6dc839de4a.jpg" },
  metal: { nom: "Métal", ref: "Chromed Metal", image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/ki01_e5536ae2ce.jpg" },
  textile: { nom: "Cuir & textile", ref: "Graphite", image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/LP_04_Graphite_2802668bd8.png" },
  paillettes: { nom: "Paillettes", ref: "Midnight Blue Disco", image: "https://ssi.s3.fr-par.scw.cloud/cover-styl/web/r11_9f09c9b29b.jpg" },
};
const COMPTES = (revetements as { famille: string }[]).reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.famille]: (acc[r.famille] ?? 0) + 1 }), {});

function Hero() {
  return (
    <section className="relative min-h-[88vh] md:min-h-screen flex items-center overflow-hidden">
      <HeroVideo />
      <div className="container-custom relative z-10 px-4 sm:px-6 lg:px-8 py-28 md:py-32">
        <p className="text-rouge font-bold text-sm uppercase tracking-widest mb-4">Covering adhésif · Montpellier &amp; France</p>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-tight mb-6 max-w-4xl text-balance">
          Rénover sans casser.
        </h1>
        <p className="text-gris-200 text-lg md:text-2xl max-w-2xl leading-relaxed mb-8">
          Cuisine, salle de bain, meubles, locaux professionnels : un film Cover Styl&apos; posé sur vos surfaces existantes. Une journée de pose, réversible, garanti {GARANTIE_ANS} ans.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/simulation" className="btn-primary">
            Simuler sur ma photo
          </Link>
          <Link href="/devis" className="btn-secondary">
            Demander un devis
          </Link>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gris-300">
          <li>Devis gratuit {DELAI_REPONSE}</li>
          <li>Dès {PRIX_ML_MIN} €/ml fourni et posé</li>
          <li>{NB_REFERENCES} finitions Cover Styl&apos;</li>
        </ul>
      </div>
    </section>
  );
}

function CeQueCaChange() {
  const points = [
    { titre: "Pas de travaux", texte: "Le film se pose sur l'existant : pas de démontage, pas de poussière, pas de séchage. La pièce est utilisable le soir même." },
    { titre: "Un prix lisible", texte: `Au mètre linéaire de film posé, fourni et posé : ${PRIX_PLAGE} selon la gamme et la taille du chantier. Le devis détaille chaque surface.` },
    { titre: "Réversible et garanti", texte: `Le film se retire à chaud sans abîmer le support. Pose et films garantis ${GARANTIE_ANS} ans contre le décollement et la décoloration.` },
  ];
  return (
    <section className="section-padding bg-noir">
      <div className="container-custom grid md:grid-cols-3 gap-6">
        {points.map((p, i) => (
          <ScrollReveal key={p.titre} delay={i * 0.06}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <h2 className="font-display text-2xl font-bold mb-3">{p.titre}</h2>
              <p className="text-gris-400 leading-relaxed">{p.texte}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function Prestations() {
  return (
    <section className="section-padding pt-0 bg-noir">
      <div className="container-custom">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Ce que nous recouvrons</h2>
          <Link href="/prestations" className="text-sm text-gris-400 hover:text-white transition-colors shrink-0">
            Toutes les prestations →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PRESTATIONS.map((p) => (
            <Link key={p.slug} href={`/prestations/${p.slug}`} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-rouge/50 transition-colors">
              <p className="font-display text-xl font-bold mb-2">{p.court}</p>
              <p className="text-sm text-gris-400 leading-relaxed">{p.accroche}</p>
              <p className="text-xs text-gris-500 mt-3">{p.prix.fourchette === "sur devis" ? "Sur devis" : p.prix.fourchette}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommentCaMarche() {
  const etapes = [
    { titre: "Une photo", texte: "Vous photographiez la pièce ou le meuble. La simulation montre l'effet d'une finition sur votre propre photo, en moins d'une minute." },
    { titre: `Un devis ${DELAI_REPONSE}`, texte: "Chiffré au mètre linéaire, finition par finition, déplacement compris dans le devis. Teintes validées sur échantillons." },
    { titre: "Une journée de pose", texte: "Nettoyage, pose à chaud, finitions vérifiées avec vous. Pas de gravats : vous retrouvez la pièce le soir même." },
  ];
  return (
    <section className="section-padding bg-noir">
      <div className="container-custom">
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-10">Comment ça se passe</h2>
        <ol className="grid md:grid-cols-3 gap-6">
          {etapes.map((e, i) => (
            <li key={e.titre} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <span className="font-display text-4xl font-bold text-rouge/60">{i + 1}</span>
              <h3 className="font-display text-xl font-bold mt-2 mb-2">{e.titre}</h3>
              <p className="text-gris-400 leading-relaxed">{e.texte}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Tarifs() {
  const lignes = [
    { projet: FOURCHETTES.cuisine.libelle, prix: fourchette("cuisine") },
    { projet: FOURCHETTES.sdb.libelle, prix: fourchette("sdb") },
    { projet: FOURCHETTES.meuble.libelle, prix: fourchette("meuble") },
    { projet: FOURCHETTES.pro.libelle, prix: fourchette("pro") },
  ];
  return (
    <section id="tarifs" className="section-padding pt-0 bg-noir">
      <div className="container-custom grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Des prix au mètre linéaire</h2>
          <p className="text-gris-300 leading-relaxed mb-4">
            Nous mesurons le film réellement posé et le facturons fourni et posé : <strong className="text-white">{PRIX_PLAGE}</strong> selon la gamme Cover Styl&apos; choisie, la taille du chantier et la complexité de la pose. Plus le métrage est grand, plus le prix au mètre baisse.
          </p>
          <p className="text-sm text-gris-500 mb-6">{ENTREPRISE.tvaMention}. Devis gratuit, valable 30 jours, acompte de 30 % à la commande.</p>
          <Link href="/devis" className="btn-primary">
            Devis gratuit {DELAI_REPONSE}
          </Link>
        </div>
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">Ordres de grandeur par type de projet, fourni et posé</caption>
          <thead>
            <tr className="text-xs uppercase tracking-widest text-gris-500 border-b border-white/10">
              <th scope="col" className="py-3 pr-4 font-medium">Projet</th>
              <th scope="col" className="py-3 font-medium text-right">Ordre de grandeur</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.projet} className="border-b border-white/5">
                <td className="py-4 pr-4 text-gris-300">{l.projet}</td>
                <td className="py-4 text-right font-display font-bold text-white whitespace-nowrap">{l.prix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Catalogue() {
  return (
    <section className="section-padding bg-noir">
      <div className="container-custom">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">{NB_REFERENCES} finitions Cover Styl&apos;</h2>
          <Link href="/revetements" className="text-sm text-gris-400 hover:text-white transition-colors shrink-0">
            Voir le catalogue →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(TEMOINS).map(([famille, t]) => (
            <Link key={famille} href={`/revetements?famille=${famille}`} className="group">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group-hover:border-rouge/50 transition-colors">
                <Image src={t.image} alt={`${t.nom} — exemple ${t.ref}`} fill sizes="(max-width: 640px) 50vw, 160px" loading="lazy" className="object-cover" />
              </div>
              <p className="font-display font-bold mt-2">{t.nom}</p>
              <p className="text-xs text-gris-500">{COMPTES[famille] ?? 0} références</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Zones() {
  return (
    <section className="section-padding pt-0 bg-noir">
      <div className="container-custom rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Basés à {ENTREPRISE.adresse.ville}, sur la métropole de Montpellier</h2>
        <p className="text-gris-400 leading-relaxed mb-5">
          Interventions courantes dans l&apos;{ENTREPRISE.zone.departement} et les départements voisins ; partout en {ENTREPRISE.zone.etendue}, le déplacement étant écrit dans le devis.
        </p>
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => (
            <Link key={z.slug} href={`/zones/${getZoneSlug(z)}`} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-rouge hover:text-white transition-colors">
              {z.ville}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="section-padding pt-0 bg-noir">
      <FAQSchema faqs={FAQ_GENERALE} />
      <div className="container-custom max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-8">Questions fréquentes</h2>
        <div className="space-y-3">
          {FAQ_GENERALE.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer font-display font-bold text-lg list-none">
                {f.q}
                <span aria-hidden className="text-rouge transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
              </summary>
              <p className="text-gris-400 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAFinal() {
  return (
    <section className="section-padding pt-0 bg-noir">
      <div className="container-custom rounded-3xl bg-rouge/10 border border-rouge/30 p-8 md:p-14 text-center">
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 text-balance">Voyez votre pièce transformée avant de décider</h2>
        <p className="text-gris-300 max-w-xl mx-auto mb-8">Une photo suffit. Vos coordonnées ne sont demandées que si vous voulez recevoir le rendu et un devis.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/simulation" className="btn-primary">
            Simuler sur ma photo
          </Link>
          <a href={`tel:${ENTREPRISE.telephoneInternational}`} className="btn-secondary">
            {ENTREPRISE.telephone}
          </a>
        </div>
        <p className="text-sm text-gris-500 mt-6">
          Une cuisine complète : {euros(FOURCHETTES.cuisine.min)} à {euros(FOURCHETTES.cuisine.max)} fourni et posé.
        </p>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <CeQueCaChange />
      <Prestations />
      <SimulationSection />
      <CommentCaMarche />
      <Tarifs />
      <Catalogue />
      <Zones />
      <FAQ />
      <CTAFinal />
    </>
  );
}
