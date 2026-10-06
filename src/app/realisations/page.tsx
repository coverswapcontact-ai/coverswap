import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { CarteRealisation } from "@/components/CarteRealisation";
import { CarteAmbiance } from "@/components/ambiances/CarteAmbiance";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { CartesPieces } from "@/components/simulation/CartesPieces";
import { Etiquette } from "@/components/simulation/Etiquette";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { lienPiece } from "@/data/prestations";
import { lienSimuler } from "@/lib/liens-simulateur";
import { ENTREPRISE } from "@/lib/entreprise";
import { versEtudeReelle } from "@/lib/etude-de-cas";
import { PHOTOS_PIECES } from "@/lib/images-pieces";
import { metadonneesPage } from "@/lib/metadonnees";
import { DELAI_REPONSE, PRIX_PLAGE } from "@/lib/offre";
import { chargerPublications, libelleProjet, type Publication } from "@/lib/publications";
import { chargerZonesSimulateur } from "@/lib/simulateur/zones";
import { chargerTarifs } from "@/lib/tarifs-site";
import { styleTeinte, teintePrestation } from "@/lib/teintes-prestations";
import { pairesRealisations } from "./paires";

/**
 * « Réalisations » (mission 16, partie 5 ; site 3.0, lot C5) : se projeter, puis simuler. Les vraies d'abord :
 *  - Les réalisations publiées par le CRM (`chargerPublications`, accord écrit du client) : une carte par
 *    réalisation (`CarteRealisation` : avant / après, matières → leur fiche, prix et durée publiés sinon
 *    habituels libellés comme tels, ville), puis « Simuler ma pièce ». Sans réalisation : « Les premières réalisations
 *    arrivent », le lien Instagram et le même bouton.
 *  - Puis, SÉPARÉE et clairement étiquetée, la section « Avant / après en ambiance » : quatre paires de la série 2
 *    (cuisine, salle de bain, meubles, pro ; `./paires`), chacune « Ambiance · avant / après », à la teinte de sa
 *    prestation, avec ses cartels, le tarif de sa famille lu au CRM et « Essayer cette composition chez moi »
 *    (`depuis=realisations`).
 *    Jamais présentées comme des chantiers, jamais « Simulation ».
 *  - Les avis publiés (`PublicationSite` ne relie pas un avis à une réalisation : ils ont leur section).
 *  - En bas : les cinq pièces (`CartesPieces`, photos d'ambiance) → les pages par pièce (/prestations/cuisine,
 *    /salle-de-bain, /meubles, /pro ; murs et plafond → le simulateur), avec les textes de l'ancien index
 *    /prestations (301 ici) : présentation, tarif, « Un doute sur ce qui est possible chez vous ? », vitrages.
 */
export const revalidate = 300;

const CHEMIN = "/realisations";
/** « Simuler ma pièce » de la page (relecture des lots B et C : il partait sans `depuis`). */
const LIEN_SIMULER = lienSimuler({ depuis: "realisations" });

const TITRE = "Réalisations et avis — covering adhésif à Montpellier | CoverSwap";
const SUJET = "Cuisines, salles de bain, meubles et locaux recouverts d'un film Cover Styl'";

/**
 * La description (et donc l'Open Graph et la carte de partage) dit ce que la page montre VRAIMENT : des photos de
 * chantier seulement si le CRM en a publié, sinon des exemples en ambiance étiquetés ; « leurs avis » seulement s'il y
 * en a.
 * Même lecture que la page (`chargerPublications`, en cache 300 s) : aucune requête de plus.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { realisations, avis } = await chargerPublications();
  const description =
    realisations.length > 0
      ? `${SUJET} : photos après chantier publiées avec l'accord des clients${avis.length > 0 ? ", et leurs avis" : ""}.`
      : `${SUJET} : des exemples en ambiance, étiquetés comme tels, et nos tarifs.`;
  return metadonneesPage({ titre: TITRE, description, chemin: CHEMIN });
}

const TAILLES_CARTE = "(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw";
const TAILLES_PAIRE = "(min-width: 1152px) 552px, (min-width: 768px) calc(50vw - 36px), calc(100vw - 32px)";

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
  const [{ realisations, avis }, zones, tarifs] = await Promise.all([chargerPublications(), chargerZonesSimulateur(), chargerTarifs()]);
  const paires = pairesRealisations(tarifs);
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
            {realisations.length > 0 ? "Photos prises à la fin des chantiers, publiées avec l'accord des personnes. Pas d'image de catalogue présentée comme une pose." : "Des avant / après en ambiance, étiquetés comme tels, avec nos tarifs, en attendant les photos de nos chantiers."}
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
            <Lien href={LIEN_SIMULER}>Simuler ma pièce</Lien>
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
          <div>
            <Lien href={LIEN_SIMULER}>Simuler ma pièce</Lien>
          </div>
        </Section>
      )}

      {/* ── Les avant / après en ambiance : une section à part, toujours après les vrais chantiers ── */}
      {paires.length > 0 ? (
        <Section id="en-ambiance" large differee ton="papier-2" titre="Avant / après en ambiance" intro="Glissez le curseur : à gauche la pièce d'origine, à droite la même avec les vraies matières du catalogue.">
          <p className="flex flex-wrap items-center gap-3">
            <Etiquette>Ambiance · avant / après</Etiquette>
            <span className="text-[15px] text-encre-2">Images d&apos;ambiance, pas des chantiers : les teintes sont celles du catalogue.</span>
          </p>
          <ul className="mt-8 grid gap-12 md:grid-cols-2 md:gap-x-6">
            {paires.map(({ id, cas, prix }) => {
              const t = teintePrestation(id);
              return (
                <li key={cas.ambiance.id} className="filet flex flex-col pt-4" style={styleTeinte(t)}>
                  <article className="flex grow flex-col">
                    <CarteAmbiance cas={cas} tailles={TAILLES_PAIRE} teinte={t?.seconde?.hex ?? t?.teinte.hex} cartelsColonnes="grid-cols-2">
                      <p className="mt-4 text-[15px] font-medium text-encre">{prix}</p>
                    </CarteAmbiance>
                  </article>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {avis.length > 0 ? (
        <Section large differee titre="Avis clients">
          <div className="grid gap-5 md:grid-cols-3">
            {avis.map((p) => (
              <CarteAvis key={p.id} p={p} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* Les cinq pièces → les pages par pièce ; les textes de l'ancien index /prestations. */}
      <Section large differee ton={avis.length > 0 ? "papier-2" : "papier"} titre="Ce que nous recouvrons" intro="Un film adhésif Cover Styl' posé à chaud sur vos surfaces existantes : la pièce change de style en une journée, sans démontage ni gravats, et le film se retire sans trace.">
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
