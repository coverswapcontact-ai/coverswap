import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { PhotoAmbiance } from "@/components/ambiances/PhotoAmbiance";
import { lienMatiere } from "@/components/ambiances/CalqueMatieres";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { PIECES_INSPIRATION, TEINTES, inspirations, type AmbianceResolue } from "@/lib/ambiances";
import { ENTREPRISE } from "@/lib/entreprise";
import { metadonneesPage } from "@/lib/metadonnees";
import { urlVignette } from "@/lib/simulateur/generation-client";
import { FiltresInspirations, reglesFiltres, teinteJeton } from "./_components/FiltresInspirations";

/**
 * « Inspirations » (mission 19) : toutes les ambiances, filtrables par pièce et par teinte. C'est l'association des
 * matières qui crée l'ambiance : chaque photo montre sa composition (2 ou 3 revêtements, la surface de chacun, la
 * vraie vignette), ses étiquettes matière, et « Essayer cette composition chez moi » (le simulateur avec les
 * références posées zone par zone). Les images sont des ambiances générées aux teintes réelles du catalogue, jamais
 * des chantiers : l'étiquette « Ambiance » le dit sur chaque photo. Source unique : `data/ambiances`. Les filtres
 * n'envoient aucun JavaScript (boutons radio et règles CSS `:has()`, `FiltresInspirations`).
 */
const CHEMIN = "/inspirations";
const TITRE = "Inspirations : cuisines, salles de bain, meubles et locaux en film adhésif | CoverSwap";
const DESCRIPTION =
  "Des ambiances composées avec les vraies matières Cover Styl' : chaque photo dit ses références, surface par surface. Filtrez par pièce et par teinte, puis essayez la composition chez vous.";

export const metadata: Metadata = metadonneesPage({
  titre: TITRE,
  description: DESCRIPTION,
  chemin: CHEMIN,
});

const TAILLES = "(min-width: 1152px) 560px, (min-width: 768px) 50vw, 100vw";

/** Les teintes d'une ambiance, en jetons CSS (`data-teintes`). */
const jetons = (a: AmbianceResolue) => [...new Set(a.surfaces.map((s) => teinteJeton(s.teinte)))];

export default function PageInspirations() {
  const liste = inspirations();
  const pieces = PIECES_INSPIRATION.map((p) => ({
    id: p.id,
    libelle: p.libelle,
    nombre: liste.filter((a) => a.piece === p.id).length,
  })).filter((p) => p.nombre > 0);
  const teintes = TEINTES.map((t) => ({
    id: teinteJeton(t),
    libelle: t,
    nombre: liste.filter((a) => a.surfaces.some((s) => s.teinte === t)).length,
  })).filter((t) => t.nombre > 0);

  return (
    <div className="filtrable bg-fond">
      <style>{reglesFiltres(".filtrable", liste.map((a) => ({ piece: a.piece, teintes: jetons(a) })), pieces.map((p) => p.id), teintes.map((t) => t.id))}</style>
      <BreadcrumbSchema
        items={[
          { name: "Accueil", url: ENTREPRISE.site },
          { name: "Inspirations", url: `${ENTREPRISE.site}${CHEMIN}` },
        ]}
      />
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Inspirations" }]} />
          <p className="surtitre">Ambiances</p>
          <h1 className="titre-1 mt-2 text-encre">Inspirations</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">
            Une ambiance, c&apos;est une association de matières. Chaque photo donne les siennes, surface par surface, aux teintes réelles du catalogue : essayez-la chez vous en un geste.
          </p>
          <div className="mt-6">
            <FiltresInspirations pieces={pieces} teintes={teintes} />
          </div>
        </div>
      </section>
      <Section large className="pt-6 md:pt-8">
        <ul className="flex flex-col gap-12 md:block md:columns-2 md:gap-6">
          {liste.map((a) => (
            <li key={a.id} id={a.id} data-inspiration="" data-piece={a.piece} data-teintes={jetons(a).join(" ")} className="scroll-mt-[80px] md:mb-12 md:break-inside-avoid">
              <PhotoAmbiance ambiance={a} tailles={TAILLES} sansListe />
              <h2 className="mt-4 text-[19px] font-semibold text-encre">{a.titre}</h2>
              <ul className="mt-3 flex flex-col gap-2" aria-label={`Composition : ${a.titre}`}>
                {a.surfaces.map((s, i) => (
                  <li key={s.ref + s.surface}>
                    <a href={lienMatiere(s.ref)} className="group flex items-center gap-3">
                      {/* Le numéro du point posé sur la photo (téléphone). */}
                      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-trait bg-white text-[12px] font-semibold text-encre md:hidden">
                        {i + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element -- vignette de 320 px servie par le CRM */}
                      <img
                        src={urlVignette(s.ref)}
                        alt=""
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 shrink-0 rounded-[var(--rayon-sm)] object-cover ring-1 ring-trait"
                      />
                      <span className="text-[15px] leading-snug">
                        <span className="block text-encre-2 first-letter:uppercase">{s.surface}</span>
                        <span className="block font-medium text-encre group-hover:underline">
                          {`${s.nom} · ${s.ref}`}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="mt-14 flex flex-col items-start gap-3">
          <p className="texte-2">Une matière vous plaît seule ? Elles sont toutes dans le catalogue.</p>
          <Lien href="/matieres" variante="secondaire">
            Voir les matières
          </Lien>
        </div>
      </Section>
    </div>
  );
}
