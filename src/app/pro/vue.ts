import { resoudreCas, type CasAmbiance } from "@/components/ambiances/cas";
import { choisirOuverture, type ChoixOuverture } from "@/components/accueil/etudes";
import { versEtudeReelle, type EtudeReelle } from "@/lib/etude-de-cas";
import type { ManifesteImages } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import type { Publication } from "@/lib/publications";
import type { MatiereCartel } from "@/lib/cartel";
import { matiereCartel } from "@/lib/matieres-vedettes";
import { PAIRE_COMPTOIR_PRO, PAIRE_COMPTOIR_PRO_COULEUR, PAIRE_PRO, REFERENCES_PRO } from "./contenu";

/**
 * Ce que montre `/pro` (site 3.0, lot C2 ; énoncé, § C.2), en règles pures et testées — les vraies d'abord :
 *  - l'ouverture : la première réalisation PRO publiée par le CRM qui a ses deux photos (« Réalisation, <ville> »),
 *    sinon l'avant / après du comptoir d'accueil (« Ambiance · avant / après », sa légende) — `choisirOuverture`,
 *    la règle de l'accueil et des pages de prestation ;
 *  - les autres réalisations PRO publiées (avec leur photo après), dans l'ordre du CRM ;
 *  - les lieux en ambiance : le comptoir s'il a laissé l'ouverture à une réalisation, puis les lieux de la série 1 — le
 *    bar du restaurant (paire), l'hôtel, la boutique, les bureaux —, chacun étiqueté par sa carte. La page n'a pas de
 *    simulateur : les cartes n'ont pas de lien « Essayer » (`CarteAmbiance sansLien`).
 * Site 3.0 (lot F5, maillage) : le comptoir dans son autre direction (vert sauge et marbre) suit le bar — trois avant /
 * après sur la page —, et `vedettes` : les matières posées dans l'ouverture et les lieux, une fois chacune (huit au
 * plus), vers leur fiche.
 */
export const TYPE_PROJET_PRO = "PRO";
/** Les réalisations PRO montrées sous l'ouverture, au plus. */
export const REALISATIONS_PRO_MAX = 6;

export type LieuPro = { cas: CasAmbiance; ligne?: string };
export type VuePro = { ouverture: ChoixOuverture | null; reelles: EtudeReelle[]; lieux: LieuPro[]; vedettes: MatiereCartel[] };
/** Les vedettes de /pro, au plus. */
export const VEDETTES_PRO_MAX = 8;

export function vueDuPro(realisations: readonly Publication[] = [], manifeste: ManifesteImages = MANIFESTE_IMAGES): VuePro {
  const ouverture = choisirOuverture(realisations, manifeste, { typeProjet: TYPE_PROJET_PRO, paire: PAIRE_COMPTOIR_PRO });
  const reelles = realisations
    .filter((r): r is Publication & { photoApres: string } => r.type === "REALISATION" && r.typeProjet === TYPE_PROJET_PRO && !!r.photoApres && r.id !== ouverture?.idPublication)
    .slice(0, REALISATIONS_PRO_MAX)
    .map(versEtudeReelle);
  const images: { image: string; nom: string; ligne?: string }[] = [
    ...(ouverture?.type === "realisation" ? [{ image: PAIRE_COMPTOIR_PRO.apres, nom: PAIRE_COMPTOIR_PRO.titre }] : []),
    { image: PAIRE_PRO.nom, nom: PAIRE_PRO.titre, ligne: PAIRE_PRO.ligne },
    { image: PAIRE_COMPTOIR_PRO_COULEUR.apres, nom: PAIRE_COMPTOIR_PRO_COULEUR.titre, ligne: PAIRE_COMPTOIR_PRO_COULEUR.ligne },
    ...REFERENCES_PRO.map((r) => ({ image: r.nom, nom: r.titre, ligne: r.ligne })),
  ];
  const lieux = images.flatMap(({ image, nom, ligne }) => {
    const cas = resoudreCas(image, { nom, depuis: "pro" }, manifeste);
    return cas ? [{ cas, ...(ligne ? { ligne } : {}) }] : [];
  });
  const refs = [...new Set([...(ouverture?.matieres ?? []).map((m) => m.ref), ...lieux.flatMap((l) => l.cas.matieres.map((m) => m.matiere.id))])];
  const vedettes = refs.flatMap((ref) => {
    const m = matiereCartel(ref);
    return m ? [m] : [];
  });
  return { ouverture, reelles, lieux, vedettes: vedettes.slice(0, VEDETTES_PRO_MAX) };
}
