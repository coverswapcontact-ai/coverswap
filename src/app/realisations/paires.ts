import { resoudreCas, type CasAmbiance } from "@/components/ambiances/CarteAmbiance";
import { CAS_PRESTATIONS } from "@/data/cas-prestations";
import type { ManifesteImages } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { DUREE_POSE_TEXTE, fourchette, type FOURCHETTES } from "@/lib/offre";
import { PAIRE_COMPTOIR_PRO } from "@/app/pro/contenu";

/**
 * La section « Avant / après en ambiance » de `/realisations` (site 3.0, lot C5 ; énoncé, § C.2), SÉPARÉE des vrais
 * chantiers et toujours après eux : quatre paires de la série 2, une par famille — la cuisine, la salle de bain et les
 * meubles de l'ouverture de leur page de prestation (`data/cas-prestations`, même après : une paire, une histoire),
 * le comptoir d'accueil de `/pro`. Chacune étiquetée « Ambiance · avant / après », avec ses cartels, « Essayer cette
 * composition chez moi » (`depuis=realisations`) et le prix habituel d'`offre.ts`, libellé comme tel (jamais le prix
 * d'un chantier). Pur, testé.
 */
export const DEPUIS_REALISATIONS = "realisations";

type PaireRealisations = { id: "cuisine" | "salle-de-bain" | "meubles" | "professionnel"; titre: string; apres: string; cle: keyof typeof FOURCHETTES; enUneJournee: boolean };

export const PAIRES_REALISATIONS: readonly PaireRealisations[] = [
  { id: "cuisine", titre: "Une cuisine bordeaux brillante", apres: CAS_PRESTATIONS.cuisine.ouverture.apres, cle: "cuisine", enUneJournee: true },
  { id: "salle-de-bain", titre: "Une salle de bain à baignoire", apres: CAS_PRESTATIONS["salle-de-bain"].ouverture.apres, cle: "sdb", enUneJournee: true },
  { id: "meubles", titre: "Un buffet des années 1970", apres: CAS_PRESTATIONS.meubles.ouverture.apres, cle: "meuble", enUneJournee: false },
  { id: "professionnel", titre: "Un comptoir d'accueil", apres: PAIRE_COMPTOIR_PRO.apres, cle: "pro", enUneJournee: false },
];

/** Le prix habituel d'une paire : la fourchette d'`offre.ts` fourni et posé (et la durée habituelle), sinon « sur devis ». */
export function prixHabituel({ cle, enUneJournee }: Pick<PaireRealisations, "cle" | "enUneJournee">): string {
  const f = fourchette(cle);
  if (f === "sur devis") return "Sur devis, après une visite ou sur vos photos";
  return `Prix habituel : ${f} fourni et posé${enUneJournee ? ` · pose en ${DUREE_POSE_TEXTE} en général` : ""}`;
}

export type PaireAffichee = { id: PaireRealisations["id"]; cas: CasAmbiance; prix: string };

/** Les paires préparées, dans l'ordre ; une paire dont une image manque est sautée. */
export function pairesRealisations(manifeste: ManifesteImages = MANIFESTE_IMAGES): PaireAffichee[] {
  return PAIRES_REALISATIONS.flatMap((p) => {
    const cas = resoudreCas(p.apres, { nom: p.titre, depuis: DEPUIS_REALISATIONS }, manifeste);
    return cas?.preparees.avant ? [{ id: p.id, cas, prix: prixHabituel(p) }] : [];
  });
}
