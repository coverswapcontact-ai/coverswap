import Link from "next/link";
import Breadcrumb, { type BreadcrumbItem } from "@/components/Breadcrumb";
import { BreadcrumbSchema, FAQSchema, HowToSchema, ServiceSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { PRESTATIONS, type Prestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, FACTEURS_PRIX, GARANTIE_ANS, PRIX_PLAGE } from "@/lib/offre";

/**
 * Le contenu d'une page de prestation (mission 16 : extrait de
 * `/prestations/[slug]` pour être rendu tel quel par `/pro`, thème clair).
 * Les textes et le balisage (Service, FAQ, HowTo, fil d'Ariane) sont ceux
 * de `data/prestations.ts` : rien n'est réécrit ici.
 *  - `lienDevis` : où mène « Demander un devis » (`/devis` ; `/contact` sur `/pro`) ;
 *  - `devisPrincipal` : le devis est le bouton principal (`/pro`, ou pas de
 *    simulation pour cette pièce) ; sinon c'est « Simuler sur ma photo ».
 */
export type ProprietesContenuPrestation = {
  p: Prestation;
  url: string;
  fil: BreadcrumbItem[];
  filSchema: { name: string; url: string }[];
  lienDevis?: string;
  devisPrincipal?: boolean;
};

const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white";

export default function ContenuPrestation({ p, url, fil, filSchema, lienDevis = "/devis", devisPrincipal = false }: ProprietesContenuPrestation) {
  const autres = PRESTATIONS.filter((a) => a.slug !== p.slug);
  const lienSimulation = p.simulateur ? `/simulateur?projet=${p.simulateur}` : null;
  const devisEnPremier = devisPrincipal || !lienSimulation;

  const boutons = (
    <div className="flex flex-col gap-3 sm:flex-row">
      {devisEnPremier ? (
        <>
          <Lien href={lienDevis}>Demander un devis</Lien>
          {lienSimulation ? (
            <Lien href={lienSimulation} variante="secondaire">
              Simuler sur ma photo
            </Lien>
          ) : null}
        </>
      ) : (
        <>
          <Lien href={lienSimulation!}>Simuler sur ma photo</Lien>
          <Lien href={lienDevis} variante="secondaire">
            Demander un devis
          </Lien>
        </>
      )}
    </div>
  );

  return (
    <div className="bg-fond">
      <ServiceSchema name={p.nom} description={p.descriptionSeo} url={url} typeProjet={p.court} />
      <FAQSchema faqs={p.faq} />
      <HowToSchema name={`${p.nom} : comment ça se passe`} description={p.accroche} etapes={p.deroulement} />
      <BreadcrumbSchema items={filSchema} />

      {/* ── En-tête ── */}
      <section className="bg-fond-2 px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={fil} />
          <p className="surtitre">{p.nom}</p>
          <h1 className="titre-1 mt-2 max-w-3xl text-encre">{p.h1}</h1>
          <p className="texte mt-4 mb-8 max-w-2xl text-encre-2">{p.accroche}</p>
          {boutons}
          <p className="mt-6 text-[14px] text-encre-2">
            Devis gratuit {DELAI_REPONSE} · pose garantie {GARANTIE_ANS} ans · {ENTREPRISE.zone.principale}, France entière sur devis
          </p>
        </div>
      </section>

      {/* ── Intro ── */}
      <Section>
        <div className="texte space-y-5 text-encre-2">
          {p.intro.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
      </Section>

      {/* ── Surfaces ── */}
      <Section large titre="Ce que nous recouvrons" className="pt-0">
        <div className="grid gap-5 sm:grid-cols-2">
          {p.surfaces.map((s) => (
            <article key={s.titre} className={`${CARTE} h-full p-6`}>
              <h3 className="mb-2 text-[17px] font-semibold text-encre">{s.titre}</h3>
              <p className="texte-2">{s.texte}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── Atouts ── */}
      <section className="px-4 md:px-6">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 lg:grid-cols-4">
          {p.atouts.map((a) => (
            <li key={a.titre} className={`${CARTE} p-5`}>
              <p className="mb-1 text-[16px] font-semibold text-encre">{a.titre}</p>
              <p className="text-[14px] leading-relaxed text-encre-2">{a.texte}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Déroulement ── */}
      <Section large titre="Comment ça se passe">
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {p.deroulement.map((e, i) => (
            <li key={e.titre} className={`${CARTE} p-6`}>
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border border-encre font-display text-[14px] font-semibold text-encre">
                {i + 1}
              </span>
              <h3 className="mt-3 mb-2 text-[17px] font-semibold text-encre">{e.titre}</h3>
              <p className="text-[14.5px] leading-relaxed text-encre-2">{e.texte}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Prix ── */}
      <Section large fond="fond-2">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="titre-2 mb-4 text-encre">Combien ça coûte</h2>
            <p className="texte max-w-2xl text-encre-2">{p.prix.texte}</p>
            <p className="mt-4 text-[14px] text-encre-2">
              Tarif au mètre linéaire de film posé, fourni et posé : {PRIX_PLAGE}, déterminé au devis selon {FACTEURS_PRIX}. {ENTREPRISE.tvaMention}.
            </p>
          </div>
          <div className="md:text-right">
            <p className="surtitre">{p.prix.fourchette === "sur devis" ? "Prix" : "Ordre de grandeur"}</p>
            <p className="my-2 font-display text-[26px] font-semibold text-encre">{p.prix.fourchette}</p>
            <Lien href={lienDevis} variante="secondaire">
              Devis gratuit {DELAI_REPONSE}
            </Lien>
          </div>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section titre="Questions fréquentes">
        <div className="space-y-2.5">
          {p.faq.map((f) => (
            <details key={f.q} className={`group ${CARTE} p-4`}>
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-encre">
                {f.q}
                <span aria-hidden className="text-2xl leading-none text-encre-2 transition-transform duration-[var(--duree-courte)] group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="texte-2 mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ── Autres prestations ── */}
      <Section large className="pt-0">
        <h2 className="mb-4 text-[17px] font-semibold text-encre">Nos autres prestations</h2>
        <div className="flex flex-wrap gap-3">
          {autres.map((a) => (
            <Link key={a.slug} href={`/prestations/${a.slug}`} className="inline-flex min-h-[44px] items-center rounded-full border border-trait bg-white px-5 text-[15px] text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
              {a.nom}
            </Link>
          ))}
        </div>
      </Section>

      {/* ── Dernier appel : le titre et la phrase disent le geste du bouton principal (le devis ou la simulation). ── */}
      <Section
        titre={devisEnPremier ? "Recevoir un devis détaillé" : "Voir le résultat sur votre propre photo"}
        intro={devisEnPremier ? `Envoyez vos photos et vos mesures, vous recevez un devis détaillé ${DELAI_REPONSE}.` : "Envoyez une photo, choisissez une finition, jugez sur pièce. Coordonnées demandées seulement pour recevoir le rendu et un devis."}
        fond="fond-2"
      >
        {boutons}
      </Section>
    </div>
  );
}
