import { CarteAmbiance, resoudreCas, type CasAmbiance } from "@/components/ambiances/CarteAmbiance";
import { Section } from "@/components/simulation/Section";
import type { ManifesteImages, SourcesPhoto } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";

/**
 * 3. Des cuisines comme la vôtre (site 3.0, lot B6 ; énoncé, § C.1) : six avant / après, chacun nommé par ce que les
 * gens ont chez eux. Au toucher, le curseur ; sous chaque image, les cartels des matières posées ; puis « Essayer cette
 * composition chez moi » (le simulateur, la composition posée zone par zone, `depuis=accueil-cuisines`).
 *
 * Chaque avant a deux après (série 2) : on montre celui dont le plus grand ΔE affiché est le plus petit (le plus
 * fidèle au catalogue, décision n° 9 du plan) — l-hetre couleur (7,9), blanche-jaunie bois (6,1), merisier couleur
 * (6,7), u-pavillon bois (9,2), grise-brillante couleur (5,5), maison-de-village couleur (4,1). Toutes sont des images
 * générées : « Ambiance · avant / après ». Composant serveur (seul le curseur est client).
 */
export const CUISINES_ACCUEIL: readonly { nom: string; apres: string }[] = [
  { nom: "Hêtre des années 2000", apres: "cuisine-l-hetre-apres-couleur" },
  { nom: "Blanc qui a jauni", apres: "cuisine-blanche-jaunie-apres-bois" },
  { nom: "Merisier", apres: "cuisine-merisier-apres-couleur" },
  { nom: "Chêne doré", apres: "cuisine-u-pavillon-apres-bois" },
  { nom: "Gris brillant", apres: "cuisine-grise-brillante-apres-couleur" },
  { nom: "Pin orangé", apres: "cuisine-maison-de-village-apres-couleur" },
];

export const TAILLES_CUISINES = "(min-width: 1024px) 440px, (min-width: 768px) 50vw, calc(100vw - 32px)";

/** Une cuisine de l'accueil : toujours une paire (l'avant est là), nommée. */
export type CuisineAccueil = CasAmbiance & { altAvant: string; preparees: { avant: SourcesPhoto; apres: SourcesPhoto } };

const estUnePaire = (c: CasAmbiance | null): c is CuisineAccueil => !!c?.preparees.avant && !!c.altAvant;

/** Les six cuisines résolues (`resoudreCas` : ambiance, avant, sources préparées, cartels) ; une paire non préparée est sautée. */
export function cuisinesAccueil(manifeste: ManifesteImages = MANIFESTE_IMAGES): CuisineAccueil[] {
  return CUISINES_ACCUEIL.map(({ nom, apres }) => resoudreCas(apres, { nom, depuis: "accueil-cuisines" }, manifeste)).filter(estUnePaire);
}

export function CuisinesCommeLaVotre({ cuisines = cuisinesAccueil() }: { cuisines?: CuisineAccueil[] }) {
  return (
    <Section id="cuisines" large differee ton="papier-2" titre="Des cuisines comme la vôtre" intro="Glissez le curseur : à gauche la cuisine d'origine, à droite la même avec les vraies matières du catalogue.">
      <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {cuisines.map((c) => (
          <li key={c.ambiance.id} className="flex flex-col">
            <CarteAmbiance cas={c} tailles={TAILLES_CUISINES} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
