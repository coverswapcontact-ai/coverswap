import { LegendeMatieres } from "@/components/ambiances/LegendeMatieres";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Lien } from "@/components/simulation/Lien";
import { ANCRES_ACCUEIL, LIGNE_ACCUEIL, TITRE_ACCUEIL, lienSimulerCuisine } from "./sections";
import { TAILLES_OUVERTURE, type ChoixOuverture } from "./etudes";

/**
 * 1. L'ouverture (mission 16, partie 3) : l'écran utile entier (jamais
 * `100vh` : `100svh` moins l'en-tête de 60 px), le curseur avant / après et
 * UN bouton. Sur téléphone, l'image d'abord, puis le titre, la ligne et le
 * bouton, le tout au premier écran (390 × 660) ; à partir de 768 px, le texte
 * à gauche et l'image à droite, bornée pour que l'image et ses outils tiennent
 * dans la hauteur de l'écran. Dans le document, le titre et le bouton viennent
 * AVANT l'image (lecteurs d'écran, clavier : le bouton est le premier arrêt
 * après l'en-tête) ; seul l'ordre visuel du téléphone met l'image en haut.
 * L'image « avant » est le LCP (`fetchpriority="high"`, `srcset` + `sizes` :
 * AVIF préparé pour la simulation, WebP réduit par le CRM pour une
 * réalisation). Ce que montre l'image est décidé par `choisirOuverture`
 * (`etudes.ts`) : une réalisation publiée, sinon la paire d'ambiance étiquetée.
 * Mission 19 : l'ambiance porte ses étiquettes matière, côté « après »
 * seulement ; sa légende vient sous l'image (ordinateur) ou après le bouton
 * (téléphone : le premier écran 390 × 660 garde image, titre et bouton).
 * Composant serveur (seul le curseur est client). Mission 16 (partie 6) : la
 * page d'accueil précharge l'« avant » (`prechargementOuverture`, même
 * `srcset`, mêmes `sizes`) ; ce composant, lui, ne précharge rien.
 */

/** Largeur maximale de l'image pour que image + outils (52 px) tiennent dans l'écran utile, marges comprises. */
function largeurMax(ratio: string): string {
  const [l, h] = ratio.split("/").map((v) => Number(v.trim()));
  const rapport = l > 0 && h > 0 ? l / h : 3 / 2;
  return `calc((100svh - 60px - 5rem - 52px) * ${Math.round(rapport * 1000) / 1000})`;
}

export function Ouverture({ choix }: { choix: ChoixOuverture | null }) {
  return (
    <section aria-labelledby="titre-accueil" className="bg-fond px-4 pt-4 pb-10 md:flex md:min-h-[calc(100svh-60px)] md:items-center md:px-6 md:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-10">
        <div>
          <h1 id="titre-accueil" className="titre-1 text-encre">
            {TITRE_ACCUEIL}
          </h1>
          <p className="texte-2 mt-3 max-w-md">{LIGNE_ACCUEIL}</p>
          <div id={ANCRES_ACCUEIL.boutonOuverture} className="mt-6">
            <Lien href={lienSimulerCuisine("accueil-ouverture")} className="w-full md:w-auto">
              Simuler ma cuisine
            </Lien>
          </div>
        </div>
        {choix ? (
          <div className="w-full max-md:order-first md:ml-auto" style={{ maxWidth: largeurMax(choix.ratio) }}>
            <AvantApres
              avant={choix.avant}
              apres={choix.apres}
              alt={choix.alt}
              altAvant={choix.altAvant}
              ratio={choix.ratio}
              preparees={{ ...choix.preparees, tailles: TAILLES_OUVERTURE }}
              priorite
              outilsMobile="comparer"
              etiquette={choix.etiquette}
              matieres={choix.matieres}
            />
          </div>
        ) : null}
        {/* La légende des matières : sous l'image sur ordinateur ; sur téléphone, après le bouton (le premier écran garde image, titre et bouton). */}
        {choix?.matieres && choix.lienComposition ? (
          <div className="w-full max-md:order-last md:col-start-2 md:-mt-4 md:ml-auto" style={{ maxWidth: largeurMax(choix.ratio) }}>
            <LegendeMatieres matieres={choix.matieres} lienComposition={choix.lienComposition} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
