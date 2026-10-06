import { resoudreCas, type CasAmbiance } from "@/components/ambiances/CarteAmbiance";
import { CAS_PRESTATIONS } from "@/data/cas-prestations";
import type { ManifesteImages } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { tarifDeLaFamille } from "@/components/BlocPrix";
import { DUREE_POSE_TEXTE } from "@/lib/offre-legere";
import type { IdFamilleTarifs, TarifsSite } from "@/lib/tarifs-site";
import { PAIRE_COMPTOIR_PRO } from "@/app/pro/contenu";

/**
 * La section « Avant / après en ambiance » de `/realisations` (site 3.0, lot C5 ; énoncé, § C.2), SÉPARÉE des vrais
 * chantiers et toujours après eux : quatre paires de la série 2, une par famille — la cuisine, la salle de bain et les
 * meubles de l'ouverture de leur page de prestation (`data/cas-prestations`, même après : une paire, une histoire),
 * le comptoir d'accueil de `/pro`. Chacune étiquetée « Ambiance · avant / après », avec ses cartels, « Essayer cette
 * composition chez moi » (`depuis=realisations`) et le tarif de sa famille LU AU CRM (`tarifDeLaFamille` : « Notre
 * tarif : … €/ml », « Sur devis » quand le CRM n'en publie pas ; relecture des lots B et C : plus de fourchette
 * d'`offre.ts` qui contredisait l'accueil), jamais le prix d'un chantier. Pur, testé.
 */
export const DEPUIS_REALISATIONS = "realisations";

type PaireRealisations = { id: "cuisine" | "salle-de-bain" | "meubles" | "professionnel"; titre: string; apres: string; famille: IdFamilleTarifs; enUneJournee: boolean };

export const PAIRES_REALISATIONS: readonly PaireRealisations[] = [
  { id: "cuisine", titre: "Une cuisine bordeaux brillante", apres: CAS_PRESTATIONS.cuisine.ouverture.apres, famille: "CUISINE", enUneJournee: true },
  { id: "salle-de-bain", titre: "Une salle de bain à baignoire", apres: CAS_PRESTATIONS["salle-de-bain"].ouverture.apres, famille: "SDB", enUneJournee: true },
  { id: "meubles", titre: "Un buffet des années 1970", apres: CAS_PRESTATIONS.meubles.ouverture.apres, famille: "MEUBLES", enUneJournee: false },
  { id: "professionnel", titre: "Un comptoir d'accueil", apres: PAIRE_COMPTOIR_PRO.apres, famille: "PRO", enUneJournee: false },
];

/** Le tarif d'une paire : celui de sa famille au CRM (et la durée habituelle), sinon « sur devis ». */
export function prixPaire({ famille, enUneJournee }: Pick<PaireRealisations, "famille" | "enUneJournee">, tarifs: TarifsSite | null): string {
  const tarif = tarifDeLaFamille(tarifs, famille);
  const duree = enUneJournee ? ` · pose en ${DUREE_POSE_TEXTE} en général` : "";
  return tarif ? `Notre tarif : ${tarif}, fourni et posé${duree}` : `Sur devis, après une visite ou sur vos photos${duree}`;
}

export type PaireAffichee = { id: PaireRealisations["id"]; cas: CasAmbiance; prix: string };

/** Les paires préparées, dans l'ordre, au tarif du CRM (`chargerTarifs`) ; une paire dont une image manque est sautée. */
export function pairesRealisations(tarifs: TarifsSite | null, manifeste: ManifesteImages = MANIFESTE_IMAGES): PaireAffichee[] {
  return PAIRES_REALISATIONS.flatMap((p) => {
    const cas = resoudreCas(p.apres, { nom: p.titre, depuis: DEPUIS_REALISATIONS }, manifeste);
    return cas?.preparees.avant ? [{ id: p.id, cas, prix: prixPaire(p, tarifs) }] : [];
  });
}
