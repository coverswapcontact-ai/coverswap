import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { CartesAtouts, CartesSurfaces, EtapesPrestation, PhraseTarif, QuestionsPrestation } from "@/components/BlocsPrestation";
import { BreadcrumbSchema, FAQSchema, HowToSchema, ServiceSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { PhotoAmbiance } from "@/components/ambiances/PhotoAmbiance";
import { Section } from "@/components/simulation/Section";
import { getPrestation } from "@/data/prestations";
import { ambianceDeLImage } from "@/lib/ambiances";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { DELAI_REPONSE } from "@/lib/offre";
import { FormulairePro } from "./_components/FormulairePro";
import { ANCRE_DEVIS_PRO, ARGUMENTS_PRO, LIGNE_PRO, PAIRE_PRO, REFERENCES_PRO, TITRE_PRO } from "./contenu";

/**
 * « Pro » (mission 16, partie 4) : une page, un but — le devis pro. Ouverture courte (un bouton vers le formulaire),
 * trois références en images d'ambiance étiquetées (mission 19 : la paire avant / après du restaurant, puis l'hôtel, la
 * boutique et les bureaux, chacun avec ses étiquettes matière), trois arguments, le formulaire (photos + surface, source
 * `SITE_PRO`), puis les textes de l'ancienne `/prestations/professionnel` (301 vers ici) repris EN ENTIER sous
 * « En détail » : accroche, présentation, surfaces, atouts, déroulement, prix, FAQ (et leur balisage), avec les blocs
 * des pages de prestation (`BlocsPrestation` : un seul dessin). Pas de simulateur ici.
 */
const PRO = getPrestation("professionnel");
const URL_PRO = `${ENTREPRISE.site}/pro`;
export const metadata: Metadata = PRO ? metadonneesPage({ titre: `${PRO.titreSeo} | CoverSwap`, description: PRO.descriptionSeo, chemin: "/pro" }) : {};

export default function PagePro() {
  if (!PRO) notFound();
  const paire = ambianceDeLImage(PAIRE_PRO.nom);
  const lieux = REFERENCES_PRO.map((r) => ({ r, ambiance: ambianceDeLImage(r.nom) }));
  return (
    <div className="bg-fond">
      <ServiceSchema name={PRO.nom} description={PRO.descriptionSeo} url={URL_PRO} typeProjet={PRO.court} urlOffre={`${URL_PRO}#${ANCRE_DEVIS_PRO}`} />
      <FAQSchema faqs={PRO.faq} />
      <HowToSchema name={`${PRO.nom} : comment ça se passe`} description={PRO.accroche} etapes={PRO.deroulement} />
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Pro", url: URL_PRO }]} />

      {/* ── Ouverture : un titre, une ligne, un bouton ── */}
      <section className="bg-fond px-4 pt-10 pb-[var(--espace-5)] md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Pro" }]} />
          <p className="surtitre">Professionnels</p>
          <h1 className="titre-1 mt-2 max-w-3xl text-encre">{TITRE_PRO}</h1>
          <p className="texte mt-4 mb-8 max-w-2xl text-encre-2">{LIGNE_PRO}</p>
          <Lien href={`#${ANCRE_DEVIS_PRO}`}>Demander un devis pro</Lien>
        </div>
      </section>

      {/* ── La paire du restaurant, puis trois lieux (images d'ambiance étiquetées, jamais présentées comme des chantiers) ── */}
      {paire ? (
        <section aria-labelledby="titre-paire-pro" className="bg-fond px-4 pb-[var(--espace-5)] md:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 id="titre-paire-pro" className="text-[19px] font-semibold text-encre">
              {PAIRE_PRO.titre}
            </h2>
            <p className="texte-2 mt-1 mb-4">{PAIRE_PRO.ligne}</p>
            <PhotoAmbiance ambiance={paire} paire sansLienComposition tailles="(min-width: 1152px) 1104px, 100vw" className="max-w-4xl" />
          </div>
        </section>
      ) : null}
      <section aria-label="Trois lieux" className="bg-fond px-4 pb-[var(--espace-5)] md:px-6">
        <ul className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3 md:gap-6">
          {lieux.map(({ r, ambiance }) => (
            <li key={r.nom}>
              {ambiance ? <PhotoAmbiance ambiance={ambiance} sansLienComposition tailles="(min-width: 768px) 33vw, 100vw" /> : null}
              <p className="mt-3 text-[17px] font-semibold text-encre">{r.titre}</p>
              <p className="texte-2">{r.ligne}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Trois arguments ── */}
      <section aria-label="Pourquoi le covering pour un lieu ouvert au public" className="bg-fond-2 px-4 py-[var(--espace-5)] md:px-6">
        <dl className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          {ARGUMENTS_PRO.map((a) => (
            <div key={a.titre}>
              <dt className="text-[17px] font-semibold text-encre">{a.titre}</dt>
              <dd className="texte-2 mt-1">{a.texte}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Le formulaire ── */}
      <Section id={ANCRE_DEVIS_PRO} titre="Demander un devis pro" intro={`Quelques photos et une surface approximative suffisent. Réponse ${DELAI_REPONSE}.`} className="scroll-mt-16">
        <FormulairePro />
      </Section>

      {/* ── En détail : les textes de l'ancienne page « Covering pour professionnels », repris tels quels ── */}
      <Section large differee fond="fond-2" titre="Le covering pour les professionnels, en détail">
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
    </div>
  );
}
