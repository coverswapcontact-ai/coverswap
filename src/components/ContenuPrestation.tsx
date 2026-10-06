import Link from "next/link";
import Breadcrumb, { type BreadcrumbItem } from "@/components/Breadcrumb";
import { CartesAtouts, CartesSurfaces, EtapesPrestation, PhraseTarif, QuestionsPrestation } from "@/components/BlocsPrestation";
import { ContenuPrix } from "@/components/BlocPrix";
import { CarteRealisation } from "@/components/CarteRealisation";
import { CarteAmbiance, regrouperMatieres, resoudreCas, type CasAmbiance } from "@/components/ambiances/CarteAmbiance";
import { FormulaireRappel } from "@/components/accueil/FormulaireRappel";
import { choisirOuverture, imageObjetOuverture, type ChoixOuverture } from "@/components/accueil/etudes";
import { DonneesStructurees, FAQSchema, HowToSchema, ServiceSchema, refImage } from "@/components/JsonLd";
import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { Cartel } from "@/components/revue/Cartel";
import { Echantillon } from "@/components/revue/Echantillon";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Etiquette } from "@/components/simulation/Etiquette";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { casDeLaPrestation } from "@/data/cas-prestations";
import { PRESTATIONS, lienPrestation, type Prestation } from "@/data/prestations";
import { ZONES, getZoneSlug } from "@/data/zones";
import type { MatiereCartel } from "@/lib/cartel";
import { ENTREPRISE } from "@/lib/entreprise";
import { versEtudeReelle, type EtudeReelle } from "@/lib/etude-de-cas";
import type { ManifesteImages } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { lienSimuler } from "@/lib/liens-simulateur";
import { lienMatiere, matiereCartel } from "@/lib/matieres-vedettes";
import { DELAI_REPONSE, GARANTIE_ANS, NB_REFERENCES } from "@/lib/offre";
import type { Publication } from "@/lib/publications";
import type { IdFamilleTarifs, TarifsSite } from "@/lib/tarifs-site";
import { styleTeinte, teintePrestation } from "@/lib/teintes-prestations";

/**
 * Une page par pièce (`/prestations/[slug]`) : mission 16 (partie 5), refaite au site 3.0 (lot C1 ; énoncé, § C.2),
 * à la teinte de la prestation (`teintes-prestations` : filets, cartels, bande de matière) :
 *  1. Ouverture : l'avant / après de la pièce — sa première réalisation publiée qui a ses deux photos (« Réalisation,
 *     <ville> »), sinon sa paire d'ambiance (`data/cas-prestations`, « Ambiance · avant / après ») —, le curseur, la
 *     légende et les cartels des matières posées ; le titre court, l'accroche, UNE action principale (le simulateur de
 *     la pièce, `depuis=prestation-<slug>`) et « Demander un devis » en secondaire. L'« avant » est le LCP (préchargé
 *     par la page) : c'est le seul couple prioritaire.
 *  2. Ce que ça donne : les autres réalisations publiées de la pièce d'abord, puis les cas d'ambiance (`CarteAmbiance`,
 *     étiquetés), chacun avec « Essayer cette composition chez moi » ; puis la bande de matière de la teinte.
 *  3. Les matières vedettes, en vrais échantillons, vers leur fiche.
 *  4. La présentation (l'ancien titre de la page quand il est plus long que le titre court, et ses paragraphes), les
 *     surfaces et les atouts ; 5. le déroulement ; 6. les prix (le texte de la page, puis les tarifs du CRM de la
 *     famille tels quels, `ContenuPrix`) ; 7. les villes ; 8. la FAQ ; 9. les autres prestations ; 10. le dernier
 *     appel, en encre (le même principal, « Être rappelé » et le devis en `sur-encre`).
 * Textes et balisage (`Service`, `FAQPage`, `HowTo`, fil d'Ariane) : ceux de `data/prestations.ts`, rien de réécrit.
 * Sans simulateur (vitrages, page inchangée) : ni image, ni cas, ni vedettes, ni teinte ; « Demander un devis » est le
 * bouton principal, et l'offre du `Service` le suit.
 *  - `lienDevis` : où mène « Demander un devis » (`/contact`) ;
 *  - `devisPrincipal` : le devis est le bouton principal même avec un simulateur.
 * Composant serveur, synchrone : la page charge les publications et les tarifs du CRM et les passe.
 */
export type ProprietesContenuPrestation = {
  p: Prestation;
  url: string;
  /** Le fil d'Ariane, visible et balisé (`Breadcrumb` pose aussi le `BreadcrumbList`). */
  fil: BreadcrumbItem[];
  lienDevis?: string;
  devisPrincipal?: boolean;
  /** Les réalisations publiées par le CRM (toutes pièces : la page garde les siennes). */
  realisations?: readonly Publication[];
  /** Les tarifs publics du CRM (`chargerTarifs`) ; `null` : le repli d'`offre.ts`. */
  tarifs?: TarifsSite | null;
};

/** L'attribut `sizes` de l'image de l'ouverture : 7/12 de 1 152 px dès 1 024 px, toute la largeur avant. */
export const TAILLES_OUVERTURE_PRESTATION = "(min-width: 1152px) 644px, (min-width: 1024px) 56vw, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";
const TAILLES_CAS = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, calc(100vw - 32px)";
const TAILLES_REALISATION = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw";

/** Les réalisations publiées montrées sous l'ouverture, au plus (hors celle de l'ouverture). */
export const REALISATIONS_PRESTATION_MAX = 3;

/** La famille des tarifs du CRM d'une prestation (`null` : vitrages, « AUTRE »). */
const FAMILLE_TARIFS: Readonly<Record<Prestation["crmTypeProjet"], IdFamilleTarifs | null>> = { CUISINE: "CUISINE", SDB: "SDB", MEUBLES: "MEUBLES", PRO: "PRO", AUTRE: null };

/** La valeur `depuis` des liens vers le simulateur d'une page de prestation (docs/SUIVI.md). */
export const depuisPrestation = (slug: string) => `prestation-${slug}`;

export type VuePrestation = {
  ouverture: ChoixOuverture | null;
  /** Les autres réalisations publiées de la pièce (avec leur photo après), dans l'ordre du CRM. */
  reelles: EtudeReelle[];
  cas: CasAmbiance[];
  vedettes: MatiereCartel[];
};

/**
 * Ce que montre la page d'une prestation, en règles pures : l'ouverture (`choisirOuverture` : une réalisation publiée
 * de la pièce d'abord, sinon sa paire d'ambiance), les autres réalisations de la pièce, les cas d'ambiance préparés et
 * les vedettes encore au catalogue. Vitrages (type « AUTRE » au CRM, qui range aussi d'autres chantiers) : rien.
 */
export function vueDeLaPrestation(p: Prestation, realisations: readonly Publication[] = [], manifeste: ManifesteImages = MANIFESTE_IMAGES): VuePrestation {
  const donnees = p.simulateur ? casDeLaPrestation(p.slug) : null;
  if (!donnees) return { ouverture: null, reelles: [], cas: [], vedettes: [] };
  const ouverture = choisirOuverture(realisations, manifeste, { typeProjet: p.crmTypeProjet, paire: donnees.ouverture });
  const reelles = realisations
    .filter((r): r is Publication & { photoApres: string } => r.type === "REALISATION" && r.typeProjet === p.crmTypeProjet && !!r.photoApres && r.id !== ouverture?.idPublication)
    .slice(0, REALISATIONS_PRESTATION_MAX)
    .map(versEtudeReelle);
  const depuis = depuisPrestation(p.slug);
  const cas = donnees.cas.flatMap((image) => {
    const c = resoudreCas(image, { depuis }, manifeste);
    return c ? [c] : [];
  });
  const vedettes = donnees.vedettes.flatMap((ref) => {
    const m = matiereCartel(ref);
    return m ? [m] : [];
  });
  return { ouverture, reelles, cas, vedettes };
}

/** Les villes de la zone, de la plus proche à la plus lointaine. */
const VILLES = [...ZONES].sort((a, b) => a.distanceKm - b.distanceKm);

export default function ContenuPrestation({ p, url, fil, lienDevis = "/contact", devisPrincipal = false, realisations = [], tarifs = null }: ProprietesContenuPrestation) {
  const autres = PRESTATIONS.filter((a) => a.slug !== p.slug);
  const depuis = depuisPrestation(p.slug);
  const lienSimulation = p.simulateur ? lienSimuler({ projet: p.simulateur, depuis }) : null;
  const devisEnPremier = devisPrincipal || !lienSimulation;
  const libelleSimuler = p.libelleSimuler ?? "Simuler sur ma photo";
  const teinte = p.simulateur ? teintePrestation(p.slug) : null;
  const hexTeinte = teinte?.teinte.hex;
  const matiereTeinte = teinte ? matiereCartel(teinte.teinte.ref) : null;
  const famille = FAMILLE_TARIFS[p.crmTypeProjet];
  const { ouverture, reelles, cas, vedettes } = vueDeLaPrestation(p, realisations);
  const donnees = p.simulateur ? casDeLaPrestation(p.slug) : null;
  // Site 3.0 (lot F4) : l'ImageObject de l'avant / après de l'ouverture, auquel le Service renvoie.
  const imageOuverture = imageObjetOuverture(ouverture);

  const boutons = (surEncre: boolean) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {devisEnPremier ? (
        <>
          <Lien href={lienDevis}>Demander un devis</Lien>
          {lienSimulation ? (
            <Lien href={lienSimulation} variante={surEncre ? "sur-encre" : "secondaire"}>
              {libelleSimuler}
            </Lien>
          ) : null}
        </>
      ) : (
        <>
          <Lien href={lienSimulation!}>{libelleSimuler}</Lien>
          {surEncre ? <FormulaireRappel depuis={depuis} variante="sur-encre" /> : null}
          <Lien href={lienDevis} variante={surEncre ? "sur-encre" : "secondaire"}>
            Demander un devis
          </Lien>
        </>
      )}
    </div>
  );

  return (
    <div style={styleTeinte(teinte)}>
      <ServiceSchema name={p.nom} description={p.descriptionSeo} url={url} typeProjet={p.court} urlOffre={`${ENTREPRISE.site}${devisEnPremier || !p.simulateur ? lienDevis : `/simulateur?projet=${p.simulateur}`}`} image={refImage(imageOuverture)} />
      <FAQSchema faqs={p.faq} />
      <HowToSchema name={`${p.nom} : comment ça se passe`} description={p.accroche} etapes={p.deroulement} />
      <DonneesStructurees data={imageOuverture} />

      {/* ── 1. Ouverture : l'avant / après de la pièce (téléphone : l'image d'abord), le titre, l'action ── */}
      <section aria-labelledby="titre-prestation" className="px-4 pt-4 pb-[var(--espace-5)] md:px-6 md:pt-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={fil} />
          <div className="flex flex-col gap-5 md:gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-x-12 lg:gap-y-6">
            {/* Téléphone : l'accroche passe sous les boutons, pour que le principal tienne au premier écran (390 × 660). */}
            <div className="flex flex-col lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <p className="surtitre flex items-center gap-3">
                {teinte ? <span aria-hidden="true" className="inline-block h-[3px] w-10 bg-[color:var(--teinte)]" /> : null}
                {p.nom}
              </p>
              <h1 id="titre-prestation" className="titre-1 mt-2 max-w-3xl text-balance text-encre">
                {p.titreCourt}
              </h1>
              <p className="texte mt-5 max-w-2xl text-encre-2 max-sm:order-1 sm:mt-4">{p.accroche}</p>
              <div className="mt-5 sm:mt-6 md:mt-8">{boutons(false)}</div>
              <p className="mt-6 text-[14px] text-encre-2 max-sm:order-2">
                Devis gratuit {DELAI_REPONSE} · pose garantie {GARANTIE_ANS} ans · {ENTREPRISE.zone.principale}, France entière sur devis
              </p>
            </div>
            {ouverture ? (
              <figure className="m-0 max-lg:order-first lg:col-start-2 lg:row-start-1">
                <AvantApres
                  avant={ouverture.avant}
                  apres={ouverture.apres}
                  alt={ouverture.alt}
                  altAvant={ouverture.altAvant}
                  ratio={ouverture.ratio}
                  preparees={{ ...ouverture.preparees, tailles: TAILLES_OUVERTURE_PRESTATION }}
                  priorite
                  outilsMobile="aucun"
                  etiquette={ouverture.etiquette}
                />
                <figcaption className="mt-2 text-[14px] leading-snug text-encre-2 md:mt-3 md:text-[15px]">{ouverture.legende}</figcaption>
              </figure>
            ) : null}
            {ouverture?.matieres?.length ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3 lg:col-start-2 lg:row-start-2" aria-label="Matières posées">
                {regrouperMatieres(ouverture.matieres).map((m) => (
                  <li key={m.matiere.id}>
                    <p className="text-[13px] text-encre-2">{m.surfaces}</p>
                    <Cartel matiere={m.matiere} teinte={hexTeinte} className="mt-1" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── 2. Ce que ça donne : les réalisations de la pièce d'abord, puis les cas d'ambiance ── */}
      {reelles.length > 0 || cas.length > 0 ? (
        <Section id="cas" large differee ton="papier-2" titre={donnees?.titreCas} intro={cas.some((c) => c.preparees.avant) ? "Glissez le curseur : à gauche la pièce d'origine, à droite la même avec les vraies matières du catalogue." : undefined}>
          {reelles.length > 0 ? (
            <>
              <h3 className="surtitre">Nos chantiers</h3>
              <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {reelles.map((e) => (
                  <CarteRealisation key={e.id} etude={e} avecTexte tailles={TAILLES_REALISATION} />
                ))}
              </div>
            </>
          ) : null}
          {cas.length > 0 ? (
            <div className={reelles.length > 0 ? "mt-14" : undefined}>
              <p className="flex flex-wrap items-center gap-3">
                <Etiquette>Ambiance</Etiquette>
                <span className="text-[15px] text-encre-2">Images d&apos;ambiance, pas des chantiers : les teintes sont celles du catalogue.</span>
              </p>
              <ul className="mt-8 flex flex-col gap-12 md:block md:columns-2 md:gap-x-6 lg:columns-3">
                {cas.map((c) => (
                  <li key={c.ambiance.id} className="filet flex flex-col pt-4 md:mb-12 md:break-inside-avoid">
                    <CarteAmbiance cas={c} tailles={TAILLES_CAS} teinte={hexTeinte} cartelsColonnes="grid-cols-2 md:grid-cols-1" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}
      {matiereTeinte && cas.length > 0 ? <BandeMatiere matiere={matiereTeinte} /> : null}

      {/* ── 3. Les matières vedettes, en vrais échantillons ── */}
      {vedettes.length > 0 ? (
        <Section id="matieres" large differee titre={`Des matières pour ${donnees?.pourVotre ?? "votre pièce"}`} intro={`Huit références parmi les ${NB_REFERENCES} du catalogue, à voir en vrai : on apporte les échantillons chez vous.`}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:gap-x-8">
            {vedettes.map((m) => (
              <li key={m.id}>
                <Echantillon matiere={m} href={lienMatiere(m.id)} teinte={hexTeinte} />
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Lien href="/matieres" variante="secondaire">
              Voir les {NB_REFERENCES} matières
            </Lien>
          </div>
        </Section>
      ) : null}

      {/* ── 4. Présentation (l'ancien titre de la page, s'il diffère du titre court), surfaces et atouts ── */}
      <Section large ton="papier-2" titre={p.h1 !== p.titreCourt ? p.h1 : undefined}>
        <div className="texte max-w-3xl space-y-5 text-encre-2">
          {p.intro.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
        <h2 className="titre-2 mt-14 mb-8 text-encre md:mb-10">Ce que nous recouvrons</h2>
        <CartesSurfaces surfaces={p.surfaces} />
        <CartesAtouts atouts={p.atouts} className="mt-6" />
      </Section>

      {/* ── 5. Déroulement ── */}
      <Section large differee titre="Comment ça se passe">
        <EtapesPrestation etapes={p.deroulement} />
      </Section>

      {/* ── 6. Prix : le texte de la page, puis les tarifs du CRM de la famille, tels quels ── */}
      <Section id="prix" large differee ton="papier-2" titre="Combien ça coûte">
        <p className="texte max-w-2xl text-encre-2">{p.prix.texte}</p>
        {famille ? (
          <ContenuPrix tarifs={tarifs} familles={[famille]} sansIntro className="mt-8 max-w-xl" />
        ) : (
          <p className="mt-6">
            <span className="surtitre block">Prix</span>
            <span className="mt-1 block font-display text-[26px] font-semibold text-encre">{p.prix.fourchette}</span>
          </p>
        )}
        <PhraseTarif className="mt-6 max-w-2xl" />
        <div className="mt-8">
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
      </Section>

      {/* ── 7. Les villes ── */}
      <Section id="villes" large differee titre="Où nous intervenons" intro={`On pose à ${ENTREPRISE.zone.principale}, et partout en France métropolitaine sur devis. Une page par ville :`}>
        <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
          {VILLES.map((z) => (
            <li key={z.slug} className="filet">
              <Link href={`/zones/${getZoneSlug(z)}`} className="flex min-h-[48px] items-center text-[16px] text-encre underline-offset-4 hover:underline">
                {z.ville}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── 8. FAQ ── */}
      <Section differee ton="papier-2" titre="Questions fréquentes">
        <QuestionsPrestation faq={p.faq} />
      </Section>

      {/* ── 9. Les autres prestations, chacune à sa teinte ── */}
      <Section large differee>
        <h2 className="mb-4 text-[17px] font-semibold text-encre">Nos autres prestations</h2>
        <div className="flex flex-wrap gap-3">
          {autres.map((a) => {
            const t = teintePrestation(a.slug);
            return (
              <Link key={a.slug} href={lienPrestation(a.slug)} style={styleTeinte(t)} className="inline-flex min-h-[44px] items-center gap-3 rounded-full border border-trait bg-blanc px-5 text-[15px] text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
                {t ? <span aria-hidden="true" className="inline-block h-[3px] w-5 bg-[color:var(--teinte)]" /> : null}
                {a.nom}
              </Link>
            );
          })}
        </div>
      </Section>

      {/* ── 10. Dernier appel, en encre : le titre et la phrase disent le geste du bouton principal. ── */}
      <Section
        id="dernier-appel"
        large
        differee
        ton="encre"
        titre={devisEnPremier ? "Recevoir un devis détaillé" : "Voir le résultat sur votre propre photo"}
        intro={devisEnPremier ? `Envoyez vos photos et vos mesures, vous recevez un devis détaillé ${DELAI_REPONSE}.` : "Envoyez une photo, choisissez une finition, jugez sur pièce. Coordonnées demandées seulement pour recevoir le rendu et un devis."}
      >
        {boutons(true)}
      </Section>
    </div>
  );
}
