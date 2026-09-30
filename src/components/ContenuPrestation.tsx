import Link from "next/link";
import Breadcrumb, { type BreadcrumbItem } from "@/components/Breadcrumb";
import { CartesAtouts, CartesSurfaces, EtapesPrestation, PhraseTarif, QuestionsPrestation } from "@/components/BlocsPrestation";
import { CarteRealisation } from "@/components/CarteRealisation";
import { CarteSimulee } from "@/components/accueil/RealisationsAccueil";
import type { EtudePiece } from "@/components/accueil/etudes";
import { BreadcrumbSchema, FAQSchema, HowToSchema, ServiceSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Photo } from "@/components/simulation/Photo";
import { Section } from "@/components/simulation/Section";
import { PRESTATIONS, lienPrestation, type Prestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { ALT_PIECES, PHOTOS_PIECES, photoDePiece, type PieceId } from "@/lib/images-pieces";
import { imagePreparee } from "@/lib/images-preparees";
import { DELAI_REPONSE, GARANTIE_ANS } from "@/lib/offre";

/**
 * Une page par pièce (`/prestations/[slug]`, mission 16, partie 5) : « se projeter puis simuler ».
 *  1. Ouverture : titre court (7 mots au plus), l'accroche, le bouton principal de la pièce (« Simuler ma cuisine »
 *     → `/simulateur?projet=<pièce>`) et « Demander un devis » en secondaire ; l'image d'ambiance de la pièce
 *     (`piece-*`, étiquetée « Ambiance », jamais présentée comme un chantier).
 *  2. La présentation (l'ancien titre de la page quand il est plus long que le titre court, et ses paragraphes).
 *  3. « Ce que nous recouvrons » : les surfaces, puis les atouts.
 *  4. Une étude de cas (`etude`) : la réalisation publiée de la pièce, sinon la simulation du moteur (cuisine) ; sans
 *     l'une ni l'autre, pas de section (l'ambiance de l'ouverture n'est pas montrée deux fois).
 *  5. Le déroulement, 6. « Combien ça coûte » (fourchette d'`offre.ts`, lien vers l'estimation du simulateur),
 *  7. la FAQ, 8. les autres pages de pièce, 9. le dernier appel (le même bouton).
 * Textes et balisage (`Service`, `FAQPage`, `HowTo`, fil d'Ariane) : ceux de `data/prestations.ts`, rien de réécrit.
 * Sans simulateur (vitrages) : « Demander un devis » est le bouton principal, et l'offre du `Service` le suit.
 *  - `lienDevis` : où mène « Demander un devis » (`/contact`) ;
 *  - `devisPrincipal` : le devis est le bouton principal même avec un simulateur.
 * Composant serveur, synchrone : la page charge l'étude (`etudeDeLaPiece`) et la passe.
 */
export type ProprietesContenuPrestation = {
  p: Prestation;
  url: string;
  fil: BreadcrumbItem[];
  filSchema: { name: string; url: string }[];
  lienDevis?: string;
  devisPrincipal?: boolean;
  etude?: EtudePiece | null;
};

const TAILLES_OUVERTURE = "(min-width: 1152px) 552px, (min-width: 768px) 50vw, 100vw";

/** L'image d'ambiance de la pièce, si elle est préparée (`lib/images-pieces`), avec son texte. */
export function imageDeLaPiece(p: Prestation): { nom: string; alt: string } | null {
  const nom = p.simulateur ? photoDePiece(PHOTOS_PIECES, p.simulateur) : null;
  if (!nom || !imagePreparee(nom)) return null;
  return { nom, alt: ALT_PIECES[p.simulateur as PieceId] };
}

export default function ContenuPrestation({ p, url, fil, filSchema, lienDevis = "/contact", devisPrincipal = false, etude = null }: ProprietesContenuPrestation) {
  const autres = PRESTATIONS.filter((a) => a.slug !== p.slug);
  const lienSimulation = p.simulateur ? `/simulateur?projet=${p.simulateur}` : null;
  const devisEnPremier = devisPrincipal || !lienSimulation;
  const libelleSimuler = p.libelleSimuler ?? "Simuler sur ma photo";
  const image = imageDeLaPiece(p);
  // Les fonds alternent d'une section à l'autre, avec ou sans étude de cas (le dernier appel garde son rang).
  const rang = { surfaces: 1, deroulement: etude ? 3 : 2, prix: etude ? 4 : 3, faq: etude ? 5 : 4, final: etude ? 6 : 5 };
  const fond = (n: number) => (n % 2 === 0 ? "fond-2" : "fond");

  const boutons = (
    <div className="flex flex-col gap-3 sm:flex-row">
      {devisEnPremier ? (
        <>
          <Lien href={lienDevis}>Demander un devis</Lien>
          {lienSimulation ? (
            <Lien href={lienSimulation} variante="secondaire">
              {libelleSimuler}
            </Lien>
          ) : null}
        </>
      ) : (
        <>
          <Lien href={lienSimulation!}>{libelleSimuler}</Lien>
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

      {/* ── 1. Ouverture : se projeter ── */}
      <section className="bg-fond px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={fil} />
          <div className={image ? "grid items-center gap-8 md:grid-cols-2 md:gap-12" : undefined}>
            <div>
              <p className="surtitre">{p.nom}</p>
              <h1 className="titre-1 mt-2 max-w-3xl text-encre">{p.titreCourt}</h1>
              <p className="texte mt-4 mb-8 max-w-2xl text-encre-2">{p.accroche}</p>
              {boutons}
              <p className="mt-6 text-[14px] text-encre-2">
                Devis gratuit {DELAI_REPONSE} · pose garantie {GARANTIE_ANS} ans · {ENTREPRISE.zone.principale}, France entière sur devis
              </p>
            </div>
            {image ? <Photo nom={image.nom} alt={image.alt} etiquette="Ambiance" priorite ratio="1 / 1" tailles={TAILLES_OUVERTURE} className="rounded-[var(--rayon-md)]" /> : null}
          </div>
        </div>
      </section>

      {/* ── 2. Présentation (l'ancien titre de la page, s'il diffère du titre court) ── */}
      <Section titre={p.h1 !== p.titreCourt ? p.h1 : undefined} fond="fond-2">
        <div className="texte space-y-5 text-encre-2">
          {p.intro.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
      </Section>

      {/* ── 3. Surfaces et atouts ── */}
      <Section large fond={fond(rang.surfaces)} titre="Ce que nous recouvrons">
        <CartesSurfaces surfaces={p.surfaces} />
        <CartesAtouts atouts={p.atouts} className="mt-6" />
      </Section>

      {/* ── 4. Étude de cas : réelle, sinon simulée (étiquetée) ── */}
      {etude ? (
        <Section large fond="fond-2" titre={etude.mode === "reelle" ? "Une réalisation" : "Ce que ça donne"} intro={etude.mode === "simulee" ? "Une simulation sur une image d'ambiance, et le prix constaté pour ce type de projet. Les photos de nos chantiers arrivent." : undefined}>
          <div className="max-w-md">{etude.mode === "reelle" ? <CarteRealisation etude={etude.etude} avecTexte tailles="(min-width: 768px) 448px, 100vw" /> : <CarteSimulee etude={etude.etude} tailles="(min-width: 768px) 448px, 100vw" />}</div>
        </Section>
      ) : null}

      {/* ── 5. Déroulement ── */}
      <Section large fond={fond(rang.deroulement)} titre="Comment ça se passe">
        <EtapesPrestation etapes={p.deroulement} />
      </Section>

      {/* ── 6. Prix ── */}
      <Section large fond={fond(rang.prix)}>
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="titre-2 mb-4 text-encre">Combien ça coûte</h2>
            <p className="texte max-w-2xl text-encre-2">{p.prix.texte}</p>
            <PhraseTarif className="mt-4" />
          </div>
          <div className="md:text-right">
            <p className="surtitre">{p.prix.fourchette === "sur devis" ? "Prix" : "Ordre de grandeur"}</p>
            <p className="my-2 font-display text-[26px] font-semibold text-encre">{p.prix.fourchette}</p>
            {lienSimulation ? (
              <Lien href={lienSimulation} variante="secondaire">
                Estimer sur ma photo
              </Lien>
            ) : (
              <Lien href={lienDevis} variante="secondaire">
                Devis gratuit {DELAI_REPONSE}
              </Lien>
            )}
          </div>
        </div>
      </Section>

      {/* ── 7. FAQ ── */}
      <Section fond={fond(rang.faq)} titre="Questions fréquentes">
        <QuestionsPrestation faq={p.faq} />
      </Section>

      {/* ── 8. Les autres pièces ── */}
      <Section large fond={fond(rang.faq)} className="pt-0">
        <h2 className="mb-4 text-[17px] font-semibold text-encre">Nos autres prestations</h2>
        <div className="flex flex-wrap gap-3">
          {autres.map((a) => (
            <Link key={a.slug} href={lienPrestation(a.slug)} className="inline-flex min-h-[44px] items-center rounded-full border border-trait bg-white px-5 text-[15px] text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
              {a.nom}
            </Link>
          ))}
        </div>
      </Section>

      {/* ── 9. Dernier appel : le titre et la phrase disent le geste du bouton principal (le devis ou la simulation). ── */}
      <Section
        titre={devisEnPremier ? "Recevoir un devis détaillé" : "Voir le résultat sur votre propre photo"}
        intro={devisEnPremier ? `Envoyez vos photos et vos mesures, vous recevez un devis détaillé ${DELAI_REPONSE}.` : "Envoyez une photo, choisissez une finition, jugez sur pièce. Coordonnées demandées seulement pour recevoir le rendu et un devis."}
        fond={fond(rang.final)}
      >
        {boutons}
      </Section>
    </div>
  );
}
