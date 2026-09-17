import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import TextureBackground from "@/components/TextureBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { BreadcrumbSchema, FAQSchema, HowToSchema, ServiceSchema } from "@/components/JsonLd";
import { PRESTATIONS, getPrestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, GARANTIE_ANS, PRIX_PLAGE } from "@/lib/offre";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PRESTATIONS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p) return {};
  const url = `${ENTREPRISE.site}/prestations/${p.slug}`;
  return {
    title: { absolute: `${p.titreSeo} | CoverSwap` },
    description: p.descriptionSeo,
    alternates: { canonical: url },
    openGraph: { title: p.titreSeo, description: p.descriptionSeo, url, type: "website", siteName: "CoverSwap", locale: "fr_FR", images: [{ url: `${ENTREPRISE.site}/og-image.jpg`, width: 1200, height: 630 }] },
  };
}

export default async function PagePrestation({ params }: Props) {
  const { slug } = await params;
  const p = getPrestation(slug);
  if (!p) notFound();
  const url = `${ENTREPRISE.site}/prestations/${p.slug}`;
  const autres = PRESTATIONS.filter((a) => a.slug !== p.slug);

  return (
    <main className="bg-noir min-h-screen">
      <ServiceSchema name={p.nom} description={p.descriptionSeo} url={url} typeProjet={p.court} />
      <FAQSchema faqs={p.faq} />
      <HowToSchema name={`${p.nom} : comment ça se passe`} description={p.accroche} etapes={p.deroulement} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Prestations", url: `${ENTREPRISE.site}/prestations` }, { name: p.nom, url }]} />

      {/* ── En-tête ── */}
      <section className="relative pt-32 pb-14 md:pt-40 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <TextureBackground src={p.fond} overlay="rgba(0,0,0,0.82)" fadeTop={false} fadeBottom />
        <div className="container-custom relative z-20">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Prestations", href: "/prestations" }, { label: p.court }]} />
          <p className="text-rouge font-bold text-sm uppercase tracking-widest mb-3">{p.nom}</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight max-w-3xl text-balance">{p.h1}</h1>
          <p className="text-gris-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-8">{p.accroche}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {p.simulateur ? (
              <Link href={`/simulateur?projet=${p.simulateur}`} className="btn-primary">
                Simuler sur ma photo
              </Link>
            ) : null}
            <Link href="/devis" className={p.simulateur ? "btn-secondary" : "btn-primary"}>
              Demander un devis
            </Link>
          </div>
          <p className="mt-6 text-sm text-gris-400">
            Devis gratuit {DELAI_REPONSE} · pose garantie {GARANTIE_ANS} ans · {ENTREPRISE.zone.principale}, France entière sur devis
          </p>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="section-padding pt-10 md:pt-16">
        <div className="container-custom max-w-3xl space-y-5 text-gris-300 text-lg leading-relaxed">
          {p.intro.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
      </section>

      {/* ── Surfaces ── */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-10">Ce que nous recouvrons</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {p.surfaces.map((s, i) => (
              <ScrollReveal key={s.titre} delay={i * 0.05}>
                <article className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="font-display text-xl font-bold mb-2">{s.titre}</h3>
                  <p className="text-gris-400 leading-relaxed">{s.texte}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Atouts ── */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {p.atouts.map((a) => (
              <div key={a.titre} className="rounded-2xl border border-rouge/20 bg-rouge/5 p-5">
                <p className="font-display font-bold text-white mb-1">{a.titre}</p>
                <p className="text-sm text-gris-400 leading-relaxed">{a.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Déroulement ── */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-10">Comment ça se passe</h2>
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {p.deroulement.map((e, i) => (
              <li key={e.titre} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="font-display text-3xl font-bold text-rouge/60">{i + 1}</span>
                <h3 className="font-display text-lg font-bold mt-2 mb-2">{e.titre}</h3>
                <p className="text-gris-400 text-sm leading-relaxed">{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Prix ── */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12 grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Combien ça coûte</h2>
              <p className="text-gris-300 leading-relaxed max-w-2xl">{p.prix.texte}</p>
              <p className="text-sm text-gris-500 mt-4">Tarif au mètre linéaire de film posé, fourni et posé : {PRIX_PLAGE}. {ENTREPRISE.tvaMention}.</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gris-400 text-sm uppercase tracking-widest">{p.prix.fourchette === "sur devis" ? "Prix" : "Ordre de grandeur"}</p>
              <p className="font-display text-3xl md:text-4xl font-bold text-white my-2">{p.prix.fourchette}</p>
              <Link href="/devis" className="btn-primary mt-3">
                Devis gratuit {DELAI_REPONSE}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section-padding pt-0">
        <div className="container-custom max-w-3xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-8">Questions fréquentes</h2>
          <div className="space-y-3">
            {p.faq.map((f) => (
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

      {/* ── Autres prestations ── */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <h2 className="font-display text-2xl font-bold mb-6">Nos autres prestations</h2>
          <div className="flex flex-wrap gap-3">
            {autres.map((a) => (
              <Link key={a.slug} href={`/prestations/${a.slug}`} className="rounded-full border border-white/15 px-5 py-2.5 text-sm hover:border-rouge hover:text-white transition-colors">
                {a.nom}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <div className="rounded-3xl bg-rouge/10 border border-rouge/30 p-8 md:p-12 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Voir le résultat sur votre propre photo</h2>
            <p className="text-gris-300 max-w-xl mx-auto mb-8">
              {p.simulateur ? "Envoyez une photo, choisissez une finition, jugez sur pièce. Coordonnées demandées seulement pour recevoir le rendu et un devis." : `Envoyez vos photos et vos mesures, vous recevez un devis détaillé ${DELAI_REPONSE}.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {p.simulateur ? (
                <Link href={`/simulateur?projet=${p.simulateur}`} className="btn-primary">
                  Simuler sur ma photo
                </Link>
              ) : null}
              <Link href="/devis" className={p.simulateur ? "btn-secondary" : "btn-primary"}>
                Demander un devis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
