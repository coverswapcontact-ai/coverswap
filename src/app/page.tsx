import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SimulationSection } from "@/components/HomeClient";
import { chargerZonesSimulateur } from "@/lib/simulateur/zones";
import Realisations from "@/components/Realisations";
import { CommentCaSePasse, QuestionsFrequentes } from "@/components/SectionsCommentCaMarche";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { PRESTATIONS } from "@/data/prestations";
import { ZONES, getZoneSlug } from "@/data/zones";
import revetements from "@/data/revetements.json";
import { ENTREPRISE } from "@/lib/entreprise";
import { DELAI_REPONSE, FACTEURS_PRIX, FOURCHETTES, GARANTIE_ANS, NB_REFERENCES, PRIX_ML_MAX, PRIX_ML_MIN, PRIX_PLAGE, euros, fourchette } from "@/lib/offre";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "CoverSwap — Rénover sans casser : covering adhésif à Montpellier" },
  description: `Cuisines, salles de bain, meubles et locaux professionnels recouverts d'un film Cover Styl' en une journée, sans travaux. Simulation sur votre photo, devis ${DELAI_REPONSE}, ${PRIX_PLAGE} fourni et posé selon la complexité de la pose, garantie ${GARANTIE_ANS} ans. Montpellier, Hérault, France sur devis.`,
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

const CARTE = "rounded-[var(--rayon-md)] border border-trait bg-white";
const LIEN_SECTION = "inline-flex min-h-[44px] shrink-0 items-center text-[15px] font-medium text-encre underline underline-offset-4";

/** Ouverture provisoire (mission 16, partie 1) : du texte sur le fond clair, un seul bouton ; la partie 3 pose l'image et le curseur avant / après. */
function Ouverture() {
  return (
    <section className="bg-fond-2 px-4 py-[var(--espace-5)] md:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="surtitre">Covering adhésif · Montpellier &amp; France</p>
        <h1 className="titre-1 mt-3 max-w-3xl text-encre">Transformez votre intérieur en 1 journée</h1>
        <p className="texte mt-4 max-w-2xl text-encre-2">
          Cuisine, salle de bain, meubles, locaux professionnels : un film Cover Styl&apos; posé sur vos surfaces existantes. Une journée de pose, réversible, garanti {GARANTIE_ANS} ans.
        </p>
        <div className="mt-8">
          <Lien href="/simulateur?projet=cuisine">Simuler ma cuisine</Lien>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-encre-2">
          <li>Devis gratuit {DELAI_REPONSE}</li>
          <li>{PRIX_PLAGE} fourni et posé, selon la pose</li>
          <li>{NB_REFERENCES} finitions Cover Styl&apos;</li>
        </ul>
      </div>
    </section>
  );
}

function CeQueCaChange() {
  const points = [
    { titre: "Pas de travaux", texte: "Le film se pose sur l'existant : pas de démontage, pas de poussière, pas de séchage. La pièce est utilisable le soir même." },
    { titre: "Un prix lisible", texte: `Au mètre linéaire de film posé, fourni et posé : ${PRIX_PLAGE}. Ce qui fait le chiffre, c'est la pose — ${FACTEURS_PRIX} — et le devis le détaille surface par surface.` },
    { titre: "Réversible et garanti", texte: `Le film se retire à chaud sans abîmer le support. Pose et films garantis ${GARANTIE_ANS} ans contre le décollement et la décoloration.` },
  ];
  return (
    <Section large>
      <div className="grid gap-5 md:grid-cols-3">
        {points.map((p) => (
          <div key={p.titre} className={`${CARTE} h-full p-7`}>
            <h2 className="mb-3 text-[17px] font-semibold text-encre">{p.titre}</h2>
            <p className="texte-2">{p.texte}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Prestations() {
  return (
    <Section large className="pt-0">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="titre-2 text-encre">Ce que nous recouvrons</h2>
        <Link href="/prestations" className={LIEN_SECTION}>
          Toutes les prestations
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PRESTATIONS.map((p) => (
          <Link key={p.slug} href={`/prestations/${p.slug}`} className={`${CARTE} p-5 transition-colors duration-[var(--duree-courte)] hover:border-encre`}>
            <p className="mb-2 text-[17px] font-semibold text-encre">{p.court}</p>
            <p className="text-[14.5px] leading-relaxed text-encre-2">{p.accroche}</p>
            <p className="mt-3 text-[13px] text-encre-2">{p.prix.fourchette === "sur devis" ? "Sur devis" : p.prix.fourchette}</p>
          </Link>
        ))}
      </div>
    </Section>
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
    <Section id="tarifs" large fond="fond-2">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="titre-2 mb-4 text-encre">Des prix au mètre linéaire</h2>
          <p className="texte mb-4 text-encre-2">
            Nous mesurons le film réellement posé et le facturons fourni et posé : <strong className="text-encre">{PRIX_PLAGE}</strong>. Le prix ne dépend pas du seul revêtement : il se détermine au devis selon la complexité de la pose — {FACTEURS_PRIX}. De grandes surfaces planes sans découpe se situent vers {PRIX_ML_MIN} €/ml ; une pose complexe monte jusqu&apos;à {PRIX_ML_MAX} €/ml. Ni l&apos;un ni l&apos;autre n&apos;est la règle : c&apos;est le devis, gratuit, qui fixe le chiffre.
          </p>
          <p className="mb-6 text-[14px] text-encre-2">{ENTREPRISE.tvaMention}. Devis gratuit, valable 30 jours, acompte de 30 % à la commande.</p>
          <Lien href="/devis" variante="secondaire">
            Devis gratuit {DELAI_REPONSE}
          </Lien>
        </div>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Ordres de grandeur par type de projet, fourni et posé</caption>
          <thead>
            <tr className="border-b border-trait">
              <th scope="col" className="surtitre py-3 pr-4 font-medium">
                Projet
              </th>
              <th scope="col" className="surtitre py-3 text-right font-medium">
                Ordre de grandeur
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.projet} className="border-b border-trait">
                <td className="py-4 pr-4 text-encre-2">{l.projet}</td>
                <td className="py-4 text-right font-display font-semibold whitespace-nowrap text-encre">{l.prix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Catalogue() {
  return (
    <Section large>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="titre-2 text-encre">{NB_REFERENCES} finitions Cover Styl&apos;</h2>
        <Link href="/matieres" className={LIEN_SECTION}>
          Voir le catalogue
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {Object.entries(TEMOINS).map(([famille, t]) => (
          <Link key={famille} href={`/matieres?famille=${famille}`} className="group">
            <div className="relative aspect-square overflow-hidden rounded-[var(--rayon-md)] border border-trait bg-fond-2 transition-colors duration-[var(--duree-courte)] group-hover:border-encre">
              <Image src={t.image} alt={`${t.nom} — exemple ${t.ref}`} fill sizes="(max-width: 640px) 50vw, 160px" loading="lazy" className="object-cover" />
            </div>
            <p className="mt-2 text-[15px] font-semibold text-encre">{t.nom}</p>
            <p className="text-[13px] text-encre-2">{COMPTES[famille] ?? 0} références</p>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function Zones() {
  return (
    <Section large fond="fond-2" titre={`Basés à ${ENTREPRISE.adresse.ville}, sur la métropole de Montpellier`} intro={`Interventions courantes dans l'${ENTREPRISE.zone.departement} et les départements voisins ; partout en ${ENTREPRISE.zone.etendue}, le déplacement étant écrit dans le devis.`}>
      <ul className="flex flex-wrap gap-2">
        {ZONES.map((z) => (
          <li key={z.slug}>
            <Link href={`/zones/${getZoneSlug(z)}`} className="inline-flex min-h-[44px] items-center rounded-full border border-trait bg-white px-4 text-[14.5px] text-encre transition-colors duration-[var(--duree-courte)] hover:border-encre">
              {z.ville}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function DernierAppel() {
  return (
    <Section fond="fond-2" titre="Voyez votre pièce transformée avant de décider" intro="Une photo suffit. Vos coordonnées ne sont demandées que si vous voulez recevoir le rendu et un devis.">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Lien href="/simulateur">Simuler sur ma photo</Lien>
        <Lien href={`tel:${ENTREPRISE.telephoneInternational}`} variante="secondaire">
          {ENTREPRISE.telephone}
        </Lien>
      </div>
      <p className="mt-6 text-[14px] text-encre-2">
        Une cuisine complète : {euros(FOURCHETTES.cuisine.min)} à {euros(FOURCHETTES.cuisine.max)} fourni et posé.
      </p>
    </Section>
  );
}

export default async function HomePage() {
  const zones = await chargerZonesSimulateur();
  // Mission 15 (partie 4) : les cinq cartes du module de simulation sont celles du simulateur (pièces et zones du CRM).
  const pieces = zones.pieces.map((piece) => ({ id: piece.id, libelle: piece.libelle, description: piece.zones.map((z) => z.libelle).join(", ") }));
  return (
    <>
      <Ouverture />
      <CeQueCaChange />
      <Prestations />
      <Realisations apercu />
      <SimulationSection pieces={pieces} zonesMax={zones.zonesMax} />
      <CommentCaSePasse />
      <Tarifs />
      <Catalogue />
      <Zones />
      <QuestionsFrequentes />
      <DernierAppel />
    </>
  );
}
