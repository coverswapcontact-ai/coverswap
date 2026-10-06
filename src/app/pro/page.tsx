import type { Metadata } from "next";
import Link from "@/components/LienSite";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { CartesAtouts, CartesSurfaces, EtapesPrestation, PhraseTarif, QuestionsPrestation } from "@/components/BlocsPrestation";
import { CarteRealisation } from "@/components/CarteRealisation";
import { TAILLES_OUVERTURE_PRESTATION } from "@/components/ContenuPrestation";
import { CarteAmbiance, regrouperMatieres } from "@/components/ambiances/CarteAmbiance";
import { FormulaireRappel } from "@/components/accueil/FormulaireRappel";
import { imageObjetOuverture, partageOuverture, prechargementsOuverture } from "@/components/accueil/etudes";
import { Prechargements } from "@/components/Prechargements";
import { DonneesStructurees, FAQSchema, HowToSchema, ServiceSchema, refImage } from "@/components/JsonLd";
import { BandeMatiere } from "@/components/revue/BandeMatiere";
import { Cartel } from "@/components/revue/Cartel";
import { Echantillon } from "@/components/revue/Echantillon";
import { VillesIntervention } from "@/components/VillesIntervention";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { getPrestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { lienMatiere, matiereCartel } from "@/lib/matieres-vedettes";
import { metadonneesPage } from "@/lib/metadonnees";
import { DELAI_REPONSE, NB_REFERENCES } from "@/lib/offre";
import { chargerPublications } from "@/lib/publications";
import { styleTeinte, teintePrestation } from "@/lib/teintes-prestations";
import { FormulairePro } from "./_components/FormulairePro";
import { ANCRE_DEVIS_PRO, ARGUMENTS_PRO, LIGNE_PRO, TITRE_PRO } from "./contenu";
import { vueDuPro } from "./vue";

/**
 * « Pro » (mission 16, partie 4 ; site 3.0, lot C2) : une page, un but — le devis pro. À la teinte du professionnel
 * (Black Mat K1 sur les filets, Classic Walnut D1 sur les cartels et la bande de matière) :
 *  1. Ouverture : l'avant / après — la première réalisation PRO publiée par le CRM, sinon le comptoir d'accueil
 *     (`vueDuPro`, « Ambiance · avant / après », sans lien vers le simulateur) —, le titre, une ligne, UN bouton vers
 *     le formulaire. L'« avant » est le LCP : préchargé ici, comme sur l'accueil et les prestations.
 *  2. Les autres réalisations PRO publiées (« Nos chantiers »), puis les lieux de la série 1 en images d'ambiance
 *     étiquetées : le bar du restaurant (avant / après), l'hôtel, la boutique, les bureaux, avec les cartels de leurs
 *     matières ; puis la bande Classic Walnut.
 *  3. Trois arguments ; 4. le formulaire, INCHANGÉ (photos + surface, source `SITE_PRO`) ; 5. les textes de l'ancienne
 *     `/prestations/professionnel` (301 vers ici) repris EN ENTIER sous « En détail » : accroche, présentation,
 *     surfaces, atouts, déroulement, prix, FAQ (et leur balisage), avec les blocs des pages de prestation
 *     (`BlocsPrestation` : un seul dessin) ; 6. le dernier appel, en encre (le formulaire, « Être rappelé »).
 * Pas de simulateur ici.
 */
export const revalidate = 300;

const PRO = getPrestation("professionnel");
const URL_PRO = `${ENTREPRISE.site}/pro`;
/** Site 3.0 (lot F2) : l'image de partage suit l'ouverture (une réalisation PRO publiée, sinon le comptoir, étiqueté). */
export async function generateMetadata(): Promise<Metadata> {
  if (!PRO) return {};
  const { realisations } = await chargerPublications();
  return metadonneesPage({ titre: `${PRO.titreSeo} | CoverSwap`, description: PRO.descriptionSeo, chemin: "/pro", image: partageOuverture(vueDuPro(realisations).ouverture, "/pro") });
}

const TAILLES_REALISATION = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw";
const TAILLES_PAIRE = "(min-width: 1152px) 896px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";
const TAILLES_LIEU = "(min-width: 1024px) 360px, (min-width: 768px) 33vw, calc(100vw - 32px)";

export default async function PagePro() {
  if (!PRO) notFound();
  const { realisations } = await chargerPublications();
  const { ouverture, reelles, lieux, vedettes } = vueDuPro(realisations);
  const teinte = teintePrestation("professionnel");
  const hexCartel = teinte?.seconde?.hex ?? teinte?.teinte.hex;
  const matiereBande = teinte?.seconde ? matiereCartel(teinte.seconde.ref) : null;
  const paires = lieux.filter((l) => l.cas.preparees.avant);
  const photos = lieux.filter((l) => !l.cas.preparees.avant);
  const lienDevis = `#${ANCRE_DEVIS_PRO}`;
  // Site 3.0 (lot F4) : l'ImageObject de l'avant / après de l'ouverture, auquel le Service renvoie.
  const imageOuverture = imageObjetOuverture(ouverture);

  return (
    <div style={styleTeinte(teinte)}>
      {/* L'« avant » de l'ouverture préchargé (lot C2), par un composant client depuis le lot F6 (`Prechargements`). */}
      <Prechargements liste={prechargementsOuverture(ouverture, TAILLES_OUVERTURE_PRESTATION)} />
      <ServiceSchema name={PRO.nom} description={PRO.descriptionSeo} url={URL_PRO} typeProjet={PRO.court} urlOffre={`${URL_PRO}${lienDevis}`} image={refImage(imageOuverture)} />
      <DonneesStructurees data={imageOuverture} />
      <FAQSchema faqs={PRO.faq} />
      <HowToSchema name={`${PRO.nom} : comment ça se passe`} description={PRO.accroche} etapes={PRO.deroulement} />

      {/* ── 1. Ouverture : l'avant / après (téléphone : l'image d'abord), le titre, une ligne, un bouton ── */}
      <section aria-labelledby="titre-pro" className="px-4 pt-4 pb-[var(--espace-5)] md:px-6 md:pt-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Pro", href: "/pro" }]} />
          <div className="flex flex-col gap-5 md:gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-x-12 lg:gap-y-6">
            <div className="flex flex-col lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <p className="surtitre flex items-center gap-3">
                {teinte ? (
                  <span aria-hidden="true" className="inline-flex">
                    <span className="inline-block h-[3px] w-6 bg-[color:var(--teinte)]" />
                    <span className="inline-block h-[3px] w-6 bg-[color:var(--teinte-2,var(--teinte))]" />
                  </span>
                ) : null}
                Professionnels
              </p>
              <h1 id="titre-pro" className="titre-1 mt-2 max-w-3xl text-balance text-encre">
                {TITRE_PRO}
              </h1>
              {/* Téléphone : la ligne passe sous le bouton, pour que le principal tienne au premier écran (390 × 660). */}
              <p className="texte mt-5 max-w-2xl text-encre-2 max-sm:order-1 sm:mt-4">{LIGNE_PRO}</p>
              <div className="mt-5 sm:mt-6 md:mt-8">
                <Lien href={lienDevis}>Demander un devis pro</Lien>
              </div>
              <p className="mt-6 text-[14px] text-encre-2 max-sm:order-2">
                Devis gratuit {DELAI_REPONSE} · {ENTREPRISE.zone.principale}, France entière sur devis
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
                    <Link href={lienMatiere(m.matiere.id)} className="mt-1 block underline-offset-4 hover:underline">
                      <Cartel matiere={m.matiere} teinte={hexCartel} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── 2. Les vrais chantiers d'abord, puis les lieux en ambiance (images générées, jamais présentées comme des chantiers) ── */}
      {reelles.length > 0 || lieux.length > 0 ? (
        <Section id="lieux" large differee ton="papier-2" titre="Des lieux comme le vôtre" intro={lieux.length > 0 ? "Images d'ambiance, pas des chantiers : les matières sont celles du catalogue, sur un bar, une chambre d'hôtel, une boutique et des bureaux." : undefined}>
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
          {paires.length > 0 ? (
            <ul className={`flex flex-col gap-12${reelles.length > 0 ? " mt-14" : ""}`}>
              {paires.map(({ cas, ligne }) => (
                <li key={cas.ambiance.id} className="filet flex max-w-4xl flex-col pt-4">
                  <CarteAmbiance cas={cas} tailles={TAILLES_PAIRE} teinte={hexCartel} cartelsColonnes="grid-cols-2 sm:grid-cols-3" sansLien ici="/pro">
                    {ligne ? <p className="texte-2 mt-3">{ligne}</p> : null}
                  </CarteAmbiance>
                </li>
              ))}
            </ul>
          ) : null}
          {photos.length > 0 ? (
            <ul className={`grid gap-12 md:grid-cols-3 md:gap-6${paires.length > 0 || reelles.length > 0 ? " mt-12" : ""}`}>
              {photos.map(({ cas, ligne }) => (
                <li key={cas.ambiance.id} className="filet flex flex-col pt-4">
                  <CarteAmbiance cas={cas} tailles={TAILLES_LIEU} teinte={hexCartel} cartelsColonnes="grid-cols-2 md:grid-cols-1" sansLien ici="/pro">
                    {ligne ? <p className="texte-2 mt-3">{ligne}</p> : null}
                  </CarteAmbiance>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>
      ) : null}
      {matiereBande && lieux.length > 0 ? <BandeMatiere matiere={matiereBande} /> : null}

      {/* ── 3. Trois arguments, entre filets ── */}
      <section aria-label="Pourquoi le covering pour un lieu ouvert au public" className="px-4 py-[var(--espace-5)] md:px-6">
        <dl className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3 sm:gap-6">
          {ARGUMENTS_PRO.map((a) => (
            <div key={a.titre} className="filet pt-4">
              <dt className="font-display text-[22px] leading-tight font-semibold text-encre">{a.titre}</dt>
              <dd className="texte-2 mt-2">{a.texte}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 4. Le formulaire ── */}
      <Section id={ANCRE_DEVIS_PRO} ton="papier-2" titre="Demander un devis pro" intro={`Quelques photos et une surface approximative suffisent. Réponse ${DELAI_REPONSE}.`} className="scroll-mt-16">
        <FormulairePro />
      </Section>

      {/* ── 5. En détail : les textes de l'ancienne page « Covering pour professionnels », repris tels quels ── */}
      <Section large differee titre="Le covering pour les professionnels, en détail">
        <div className="texte max-w-3xl space-y-5 text-encre-2">
          {[PRO.accroche, ...PRO.intro].map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>

        <h3 className="mt-10 mb-4 text-[17px] font-semibold text-encre">Ce que nous recouvrons</h3>
        <CartesSurfaces surfaces={PRO.surfaces} titre="h4" />
        <CartesAtouts atouts={PRO.atouts} className="mt-6" />

        <h3 className="mt-10 mb-4 text-[17px] font-semibold text-encre">Comment ça se passe</h3>
        <EtapesPrestation etapes={PRO.deroulement} titre="h4" />

        <h3 className="mt-10 mb-3 text-[17px] font-semibold text-encre">Combien ça coûte</h3>
        <p className="texte max-w-3xl text-encre-2">{PRO.prix.texte}</p>
        <PhraseTarif className="mt-3" />

        <h3 className="mt-10 mb-4 text-[17px] font-semibold text-encre">Questions fréquentes</h3>
        <div className="max-w-3xl">
          <QuestionsPrestation faq={PRO.faq} />
        </div>

        <p className="texte-2 mt-10">
          Des vitrages de bureau ou une vitrine à habiller ?{" "}
          <Link href="/prestations/vitrages" className="text-encre underline underline-offset-4">
            Les films pour vitrages
          </Link>
          .
        </p>
      </Section>

      {/* ── Site 3.0 (lot F5, maillage) : les matières de ces lieux, vers leur fiche ; puis les villes ── */}
      {vedettes.length > 0 ? (
        <Section id="matieres" large differee ton="papier-2" titre="Les matières de ces lieux" intro={`Les références posées sur ces comptoirs, ce bar, cet hôtel, cette boutique et ces bureaux, parmi les ${NB_REFERENCES} du catalogue. On apporte les échantillons sur place.`}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 md:gap-x-8">
            {vedettes.map((m) => (
              <li key={m.id}>
                <Echantillon matiere={m} href={lienMatiere(m.id)} teinte={hexCartel} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <VillesIntervention />

      {/* ── 6. Dernier appel, en encre : le formulaire en principal, « Être rappelé » en secondaire ── */}
      <Section id="dernier-appel" large differee ton="encre" titre="Un devis pour votre lieu" intro={`Quelques photos et une surface approximative, ou un appel : réponse ${DELAI_REPONSE}.`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Lien href={lienDevis}>Demander un devis pro</Lien>
          <FormulaireRappel depuis="pro" variante="sur-encre" />
        </div>
      </Section>
    </div>
  );
}
