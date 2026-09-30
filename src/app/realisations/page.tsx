import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { CarteRealisation } from "@/components/CarteRealisation";
import { choisirEtudes } from "@/components/accueil/etudes";
import { CarteSimulee } from "@/components/accueil/RealisationsAccueil";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { CartesPieces } from "@/components/simulation/CartesPieces";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { lienPiece } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { versEtudeReelle } from "@/lib/etude-de-cas";
import { PHOTOS_PIECES } from "@/lib/images-pieces";
import { metadonneesPage } from "@/lib/metadonnees";
import { DELAI_REPONSE, PRIX_PLAGE } from "@/lib/offre";
import { chargerPublications, libelleProjet, type Publication } from "@/lib/publications";
import { chargerZonesSimulateur } from "@/lib/simulateur/zones";

/**
 * « Réalisations » (mission 16, partie 5) : se projeter, puis simuler.
 *  - Des réalisations publiées par le CRM (`chargerPublications`, accord écrit du client) : une carte par
 *    réalisation (`CarteRealisation` : avant / après, matières → /matieres?ref=, prix et durée publiés sinon
 *    habituels libellés comme tels, ville), puis « Simuler ma pièce ». Les avis publiés suivent (`PublicationSite`
 *    ne relie pas un avis à une réalisation : ils ont leur section).
 *  - Sinon : « Les premières réalisations arrivent » et les trois études SIMULÉES de l'accueil (`choisirEtudes`),
 *    chacune étiquetée (« Simulation », « Ambiance »), jamais présentées comme des chantiers.
 *  - En bas : les cinq pièces (`CartesPieces`, photos d'ambiance) → les pages par pièce (/prestations/cuisine,
 *    /salle-de-bain, /meubles, /pro ; murs et plafond → le simulateur), avec les textes de l'ancien index
 *    /prestations (301 ici) : présentation, tarif, « Un doute sur ce qui est possible chez vous ? », vitrages.
 */
export const revalidate = 300;

const CHEMIN = "/realisations";

const TITRE = "Réalisations et avis — covering adhésif à Montpellier | CoverSwap";
const SUJET = "Cuisines, salles de bain, meubles et locaux recouverts d'un film Cover Styl'";

/**
 * La description (et donc l'Open Graph et la carte de partage) dit ce que la page montre VRAIMENT : des photos de
 * chantier seulement si le CRM en a publié, sinon des exemples simulés étiquetés ; « leurs avis » seulement s'il y en a.
 * Même lecture que la page (`chargerPublications`, en cache 300 s) : aucune requête de plus.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { realisations, avis } = await chargerPublications();
  const description =
    realisations.length > 0
      ? `${SUJET} : photos après chantier publiées avec l'accord des clients${avis.length > 0 ? ", et leurs avis" : ""}.`
      : `${SUJET} : des exemples simulés, étiquetés comme tels, et les prix par projet.`;
  return metadonneesPage({ titre: TITRE, description, chemin: CHEMIN });
}

const TAILLES_CARTE = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw";

function CarteAvis({ p }: { p: Publication }) {
  return (
    <blockquote className="rounded-[var(--rayon-md)] border border-trait bg-white p-6">
      {p.note ? <p className="surtitre">Note : {p.note} sur 5</p> : null}
      <p className="texte mt-2 text-encre">« {p.texte} »</p>
      <footer className="mt-3 text-[13.5px] text-encre-2">{[p.auteur, p.ville, libelleProjet(p.typeProjet)].filter(Boolean).join(" · ")}</footer>
    </blockquote>
  );
}

export default async function PageRealisations() {
  const [{ realisations, avis }, zones] = await Promise.all([chargerPublications(), chargerZonesSimulateur()]);
  const etudes = choisirEtudes([]);
  const pieces = zones.pieces.map((piece) => ({ id: piece.id, libelle: piece.libelle, description: piece.zones.map((z) => z.libelle).join(", ") }));
  const liens = Object.fromEntries(pieces.map((piece) => [piece.id, lienPiece(piece.id)]));
  const lienTexte = "text-encre underline underline-offset-4";

  return (
    <div className="bg-fond">
      <BreadcrumbSchema items={[{ name: "Accueil", url: ENTREPRISE.site }, { name: "Réalisations", url: `${ENTREPRISE.site}${CHEMIN}` }]} />
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Réalisations" }]} />
          <h1 className="titre-1 max-w-3xl text-encre">Ce que ça donne</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">
            {realisations.length > 0 ? "Photos prises à la fin des chantiers, publiées avec l'accord des personnes. Pas d'image de catalogue présentée comme une pose." : "Des exemples simulés, étiquetés comme tels, avec les prix habituels par projet."}
          </p>
        </div>
      </section>

      {realisations.length > 0 ? (
        <Section large>
          {/* Le h2 des cartes (leurs titres sont des h3) : lu par les lecteurs d'écran, le h1 dit déjà la même chose à l'œil. */}
          <h2 className="sr-only">Nos chantiers</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {realisations.map((p) => (
              <CarteRealisation key={p.id} etude={versEtudeReelle(p)} avecTexte tailles={TAILLES_CARTE} />
            ))}
          </div>
          <div className="mt-8 md:mt-10">
            <Lien href="/simulateur">Simuler ma pièce</Lien>
          </div>
        </Section>
      ) : (
        <Section large titre="Les premières réalisations arrivent" intro={
          <>
            Chaque chantier terminé est photographié ; les photos paraissent ici avec l&apos;accord des clients. En attendant, nos poses sont visibles sur{" "}
            <a href={ENTREPRISE.reseaux.instagram} target="_blank" rel="noopener noreferrer" className={lienTexte}>
              Instagram
            </a>
            .
          </>
        }>
          {etudes.mode === "simulees" ? (
            <div className="grid gap-5 md:grid-cols-3">
              {etudes.etudes.map((e) => (
                <CarteSimulee key={e.id} etude={e} />
              ))}
            </div>
          ) : null}
          <div className="mt-8 md:mt-10">
            <Lien href="/simulateur">Simuler ma pièce</Lien>
          </div>
        </Section>
      )}

      {avis.length > 0 ? (
        <Section large titre="Avis clients" fond="fond-2">
          <div className="grid gap-5 md:grid-cols-3">
            {avis.map((p) => (
              <CarteAvis key={p.id} p={p} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Les cinq pièces → les pages par pièce ; les textes de l'ancien index /prestations. */}
      <Section large fond={avis.length > 0 ? "fond" : "fond-2"} titre="Ce que nous recouvrons" intro="Un film adhésif Cover Styl' posé à chaud sur vos surfaces existantes : la pièce change de style en une journée, sans démontage ni gravats, et le film se retire sans trace.">
        <CartesPieces pieces={pieces} liens={liens} photos={PHOTOS_PIECES} nom="Les pièces que nous recouvrons" />
        <div className="texte-2 mt-8 max-w-2xl space-y-3">
          <p>
            Tarif au mètre linéaire, {PRIX_PLAGE} fourni et posé : le chiffre se détermine au devis selon la complexité de la pose. Devis gratuit {DELAI_REPONSE}. Aussi : les{" "}
            <Link href="/prestations/vitrages" className={lienTexte}>
              films pour vitrages
            </Link>
            .
          </p>
          <p>
            Un doute sur ce qui est possible chez vous ? Envoyez des photos : nous vous disons ce qui se recouvre, ce qui ne se recouvre pas, et à quel prix, {DELAI_REPONSE}.{" "}
            <Link href="/contact" className={lienTexte}>
              Envoyer mes photos
            </Link>
          </p>
        </div>
      </Section>
    </div>
  );
}
