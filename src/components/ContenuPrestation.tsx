import Link from "next/link";
import Breadcrumb, { type BreadcrumbItem } from "@/components/Breadcrumb";
import { CartesAtouts, CartesSurfaces, EtapesPrestation, PhraseTarif, QuestionsPrestation } from "@/components/BlocsPrestation";
import { BreadcrumbSchema, FAQSchema, HowToSchema, ServiceSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { PRESTATIONS, lienPrestation, type Prestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, GARANTIE_ANS } from "@/lib/offre";

/**
 * Le contenu d'une page de prestation (`/prestations/[slug]`, thème clair).
 * Les textes et le balisage (Service, FAQ, HowTo, fil d'Ariane) sont ceux
 * de `data/prestations.ts` : rien n'est réécrit ici. Les blocs (surfaces,
 * atouts, déroulement, tarif, FAQ) sont ceux de `BlocsPrestation`, que /pro
 * rend aussi (mission 16, partie 4 : un seul dessin).
 *  - `lienDevis` : où mène « Demander un devis » (`/contact` ; mission 16, partie 4 : `/devis` est redirigé vers
 *    le simulateur) ;
 *  - `devisPrincipal` : le devis est le bouton principal (ou pas de
 *    simulation pour cette pièce) ; sinon c'est « Simuler sur ma photo ».
 * L'offre du balisage `Service` suit le bouton principal de la page : le
 * simulateur de la pièce, ou le formulaire de devis (vitrages : pas de
 * simulateur).
 */
export type ProprietesContenuPrestation = {
  p: Prestation;
  url: string;
  fil: BreadcrumbItem[];
  filSchema: { name: string; url: string }[];
  lienDevis?: string;
  devisPrincipal?: boolean;
};

export default function ContenuPrestation({ p, url, fil, filSchema, lienDevis = "/contact", devisPrincipal = false }: ProprietesContenuPrestation) {
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
      <ServiceSchema name={p.nom} description={p.descriptionSeo} url={url} typeProjet={p.court} urlOffre={`${ENTREPRISE.site}${devisEnPremier || !lienSimulation ? lienDevis : lienSimulation}`} />
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
        <CartesSurfaces surfaces={p.surfaces} />
      </Section>

      {/* ── Atouts ── */}
      <section className="px-4 md:px-6">
        <CartesAtouts atouts={p.atouts} className="mx-auto max-w-6xl" />
      </section>

      {/* ── Déroulement ── */}
      <Section large titre="Comment ça se passe">
        <EtapesPrestation etapes={p.deroulement} />
      </Section>

      {/* ── Prix ── */}
      <Section large fond="fond-2">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="titre-2 mb-4 text-encre">Combien ça coûte</h2>
            <p className="texte max-w-2xl text-encre-2">{p.prix.texte}</p>
            <PhraseTarif className="mt-4" />
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
        <QuestionsPrestation faq={p.faq} />
      </Section>

      {/* ── Autres prestations ── */}
      <Section large className="pt-0">
        <h2 className="mb-4 text-[17px] font-semibold text-encre">Nos autres prestations</h2>
        <div className="flex flex-wrap gap-3">
          {autres.map((a) => (
            <Link key={a.slug} href={lienPrestation(a.slug)} className="inline-flex min-h-[44px] items-center rounded-full border border-trait bg-white px-5 text-[15px] text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
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
