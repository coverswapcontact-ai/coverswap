import Link from "next/link";
import { Cartel } from "@/components/revue/Cartel";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Section } from "@/components/simulation/Section";
import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { ambianceDeLImage, type AmbianceResolue } from "@/lib/ambiances";
import type { MatiereCartel } from "@/lib/cartel";
import { sourcesPhoto, type ManifesteImages, type SourcesPhoto } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { avecDepuis } from "@/lib/liens-simulateur";
import { matiereCartel } from "@/lib/matieres-vedettes";

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

export type CuisineAccueil = {
  nom: string;
  ambiance: AmbianceResolue;
  altAvant: string;
  ratio: string;
  preparees: { avant: SourcesPhoto; apres: SourcesPhoto };
  /** Les matières posées, une fois chacune (les meubles hauts et bas d'une même référence ne font qu'un cartel). */
  matieres: { surfaces: string; matiere: MatiereCartel }[];
  lien: string;
};

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Les six cuisines résolues (ambiance, avant, sources préparées, cartels) ; une paire non préparée est sautée. */
export function cuisinesAccueil(manifeste: ManifesteImages = MANIFESTE_IMAGES): CuisineAccueil[] {
  return CUISINES_ACCUEIL.flatMap(({ nom, apres }) => {
    const ambiance = ambianceDeLImage(apres);
    const paire = PAIRES_SERIE_2.find((p) => p.avant === ambiance?.avant);
    const sAvant = paire ? sourcesPhoto(paire.avant, manifeste) : null;
    const sApres = sourcesPhoto(apres, manifeste);
    if (!ambiance || !paire || !sAvant || !sApres) return [];
    const parRef = new Map<string, { surfaces: string[]; matiere: MatiereCartel }>();
    for (const s of ambiance.surfaces) {
      const deja = parRef.get(s.ref);
      if (deja) deja.surfaces.push(s.surface);
      else parRef.set(s.ref, { surfaces: [s.surface], matiere: matiereCartel(s.ref) ?? { id: s.ref, nom: s.nom, famille: s.famille, hex: s.hex } });
    }
    return [
      {
        nom,
        ambiance,
        altAvant: `${paire.scene}. Image d'ambiance.`,
        ratio: paire.ratio,
        preparees: { avant: sAvant, apres: sApres },
        matieres: [...parRef.values()].map((m) => ({ surfaces: majuscule(m.surfaces.join(" et ")), matiere: m.matiere })),
        lien: avecDepuis(ambiance.lienComposition, "accueil-cuisines"),
      },
    ];
  });
}

export function CuisinesCommeLaVotre({ cuisines = cuisinesAccueil() }: { cuisines?: CuisineAccueil[] }) {
  return (
    <Section id="cuisines" large differee ton="papier-2" titre="Des cuisines comme la vôtre" intro="Glissez le curseur : à gauche la cuisine d'origine, à droite la même avec les vraies matières du catalogue.">
      <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {cuisines.map((c) => (
          <li key={c.ambiance.id} className="flex flex-col">
            <h3 className="font-display text-[24px] leading-tight font-semibold text-encre">{c.nom}</h3>
            <AvantApres
              className="mt-3"
              avant={c.preparees.avant.src}
              apres={c.preparees.apres.src}
              alt={c.ambiance.alt}
              altAvant={c.altAvant}
              ratio={c.ratio}
              preparees={{ ...c.preparees, tailles: TAILLES_CUISINES }}
              sansOutils
              etiquette="Ambiance · avant / après"
            />
            <ul className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2" aria-label={`Matières posées : ${c.nom}`}>
              {c.matieres.map((m) => (
                <li key={m.matiere.id}>
                  <p className="text-[13px] text-encre-2">{m.surfaces}</p>
                  <Cartel matiere={m.matiere} className="mt-1" />
                </li>
              ))}
            </ul>
            <Link href={c.lien} className="mt-auto inline-flex self-start pt-3 min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
              Essayer cette composition chez moi
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
