import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { CarteAmbiance } from "@/components/ambiances/CarteAmbiance";
import { Etiquette } from "@/components/simulation/Etiquette";
import { Lien } from "@/components/simulation/Lien";
import { Section } from "@/components/simulation/Section";
import { PIECES_INSPIRATION, TEINTES, type AmbianceResolue } from "@/lib/ambiances";
import { lienSimuler } from "@/lib/liens-simulateur";
import { metadonneesPage } from "@/lib/metadonnees";
import { FiltresInspirations, VoirLaSuite, reglesFiltres, reglesSuite, suitesDesAmbiances, teinteJeton } from "./_components/FiltresInspirations";
import { cartesInspirations } from "./_components/ordre";

/**
 * « Inspirations » (mission 19 ; site 3.0, lot C4) : toutes les ambiances — la série 1, les 36 « après » de la série 2,
 * les 2 ambiances ; jamais un « avant » seul —, filtrables par pièce et par teinte, sans JavaScript (boutons radio et
 * règles CSS `:has()`, `FiltresInspirations`). Chaque carte (`CarteAmbiance`, celle des pages de prestation) : son
 * titre, le curseur avant / après si c'est une paire (« Ambiance · avant / après »), sinon la photo (« Ambiance »), sa
 * composition en cartels (chacun mène à sa matière) et « Essayer cette composition chez moi » (`depuis=inspirations`).
 *
 * Praticable (la page faisait 52 cartes en deux colonnes, 18 800 px) : une grille dense (1, 2 puis 3 colonnes), un
 * ordre qui mêle les pièces (`ordreInspirations`), et les 12 premières du choix en cours seulement — le reste attend
 * « Voir toutes les ambiances » (`reglesSuite`, toujours sans JavaScript). Le serveur rend les 52 (référencement,
 * ancres `#<id>` de l'accueil et des matières, montrées même dans la suite) ; les images de la suite, différées, ne se
 * chargent pas. La première carte est une photo seule : la seule image prioritaire de la page.
 *
 * L'action principale (relecture des lots B et C : la page n'en avait pas) : « Simuler ma pièce » en fin de grille
 * (`depuis=inspirations`, comme les « Essayer » des cartes), « Voir les matières » à côté, en secondaire.
 */
const CHEMIN = "/inspirations";
const LIEN_SIMULER = lienSimuler({ depuis: "inspirations" });
const TITRE = "Inspirations covering : cuisines, bains, meubles | CoverSwap";
/** Site 3.0 (lot F2) : 155 caractères au plus, le nombre de cartes compté (jamais écrit à la main). */
const DESCRIPTION = `${cartesInspirations().length} pièces composées avec les vraies matières Cover Styl', chaque surface avec sa référence. Filtrez par pièce et par teinte, puis essayez chez vous.`;

export const metadata: Metadata = metadonneesPage({
  titre: TITRE,
  description: DESCRIPTION,
  chemin: CHEMIN,
});

const TAILLES = "(min-width: 1024px) 360px, (min-width: 640px) calc(50vw - 36px), calc(100vw - 32px)";

/** Les teintes d'une ambiance, en jetons CSS (`data-teintes`). */
const jetons = (a: AmbianceResolue) => [...new Set(a.surfaces.map((s) => teinteJeton(s.teinte)))];

export default function PageInspirations() {
  const cartes = cartesInspirations();
  const liste = cartes.map((c) => c.ambiance);
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
  const filtrables = liste.map((a) => ({ piece: a.piece, teintes: jetons(a) }));
  const idsPieces = pieces.map((p) => p.id);
  const idsTeintes = teintes.map((t) => t.id);
  const suites = suitesDesAmbiances(filtrables, idsPieces, idsTeintes);

  return (
    <div className="filtrable">
      <style>{`${reglesFiltres(".filtrable", filtrables, idsPieces, idsTeintes)}\n${reglesSuite(".filtrable", filtrables, idsPieces, idsTeintes)}`}</style>
      <section className="px-4 pt-10 md:px-6 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Inspirations", href: CHEMIN }]} />
          <p className="surtitre">Ambiances</p>
          <h1 className="titre-1 mt-2 text-encre">Inspirations</h1>
          <p className="texte mt-4 max-w-2xl text-encre-2">
            Une ambiance, c&apos;est une association de matières. Chaque image donne les siennes, surface par surface, aux teintes réelles du catalogue : essayez-la chez vous en un geste.
          </p>
          <p className="mt-4 flex flex-wrap items-center gap-3">
            <Etiquette>Ambiance</Etiquette>
            <span className="text-[15px] text-encre-2">Images d&apos;ambiance, pas des chantiers. Sur les avant / après, glissez le curseur.</span>
          </p>
          <div className="mt-6">
            <FiltresInspirations pieces={pieces} teintes={teintes} />
          </div>
        </div>
      </section>
      <Section large className="pt-6 md:pt-8">
        <ul className="sm:columns-2 sm:gap-x-6 lg:columns-3">
          {cartes.map(({ ambiance: a, cas }, rang) => (
            <li
              key={a.id}
              id={a.id}
              data-inspiration=""
              data-piece={a.piece}
              data-teintes={jetons(a).join(" ")}
              data-suite={suites[rang] || undefined}
              className="filet mb-12 flex scroll-mt-[80px] flex-col pt-4 break-inside-avoid"
            >
              <CarteAmbiance cas={cas} tailles={TAILLES} balise="h2" priorite={rang === 0} liensMatieres cartelsColonnes="grid-cols-2" />
            </li>
          ))}
        </ul>
        <VoirLaSuite />
        <div className="mt-14 flex flex-col items-start gap-3">
          <p className="texte-2">Une ambiance vous plaît ? Essayez ses matières sur la photo de votre pièce. Une matière seule ? Elles sont toutes dans le catalogue.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Lien href={LIEN_SIMULER}>Simuler ma pièce</Lien>
            <Lien href="/matieres" variante="secondaire">
              Voir les matières
            </Lien>
          </div>
        </div>
      </Section>
    </div>
  );
}
