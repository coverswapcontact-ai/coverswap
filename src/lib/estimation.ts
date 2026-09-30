import { FOURCHETTES, euros } from "./offre-legere";
import type { FormatPiece, IdFamilleTarifs, TarifsSite } from "./tarifs-site";

/**
 * L'estimation affichée après un rendu (mission 16, partie 4) : fonction PURE, testée.
 *
 * Calcul : les sous-parties « au métrage » (`metrage`, celles que la longueur de meubles chiffre : façades, meuble
 * vasque, comptoir… jamais un plan de travail ni une crédence) touchées par les zones du rendu
 * (`ZONE_VERS_SOUS_PARTIE`), chacune × les mètres du format choisi × son prix au mètre linéaire (tarifs du CRM) ;
 * total arrondi à la centaine, ± 12 % pour la fourchette. L'estimation ne cache jamais une partie du projet : si une
 * zone choisie n'est pas chiffrable par la longueur (plan de travail, crédence, tablier…), ou si quoi que ce soit
 * manque (famille sans tarifs, format inconnu, un tarif absent ou qui n'est pas au mètre linéaire) → la fourchette de
 * la pièce dans `offre.ts` (« Cuisine : 1 200 à 3 500 € », qui couvre la pièce entière), ou « sur devis ». Jamais
 * `NaN`, jamais un chiffre inventé.
 */

export const MARGE_ESTIMATION = 0.12;

/** La famille de prestations du CRM de chaque pièce du simulateur (« Murs, plafond » n'en a pas : sur devis). */
export const FAMILLE_DU_PROJET: Readonly<Record<string, IdFamilleTarifs>> = { cuisine: "CUISINE", "salle-de-bain": "SDB", meubles: "MEUBLES", professionnel: "PRO" };

/**
 * Zone du simulateur → sous-parties du CRM qu'elle chiffre. Une zone composée (« Façades (toutes) ») vaut ses
 * deux sous-parties ; l'îlot et l'électroménager ne sont jamais ajoutés d'office (ils doubleraient les façades).
 */
export const ZONE_VERS_SOUS_PARTIE: Readonly<Record<IdFamilleTarifs, Readonly<Record<string, readonly string[]>>>> = {
  CUISINE: { "facades-cuisine": ["facades-hautes", "facades-basses"], "meubles-hauts": ["facades-hautes"], "meubles-bas": ["facades-basses"], "plan-de-travail": ["plan-de-travail"], credence: ["credence"] },
  SDB: { "meuble-vasque": ["meuble-vasque"], "plan-vasque": ["plan-vasque"], "carrelage-mural": ["credence"], "tablier-baignoire": [] },
  MEUBLES: { "portes-dressing": ["portes-dressing"], "meuble-tv": ["meuble-tv"], "meuble-complet": ["autre-meuble"] },
  PRO: { "comptoir-habillage": ["comptoir"], "comptoir-plateau": ["comptoir"], "mobilier-pro": ["mobilier"], "rangements-pro": ["facade"], "habillage-mural": ["facade"] },
};

const FOURCHETTE_DE_LA_FAMILLE: Readonly<Record<IdFamilleTarifs, keyof typeof FOURCHETTES>> = { CUISINE: "cuisine", SDB: "sdb", MEUBLES: "meuble", PRO: "pro" };
const NOM_DE_LA_FAMILLE: Readonly<Record<IdFamilleTarifs, string>> = { CUISINE: "Cuisine", SDB: "Salle de bain", MEUBLES: "Meubles", PRO: "Local professionnel" };

export type Estimation =
  /** Calculée sur les tarifs du CRM et le format choisi. */
  | { type: "calculee"; famille: IdFamilleTarifs; min: number; max: number; format: FormatPiece }
  /** La fourchette de la pièce (`offre.ts`) : `max` null = « dès … ». */
  | { type: "repli"; famille: IdFamilleTarifs; min: number; max: number | null }
  | { type: "sur-devis" };

export type EntreeEstimation = {
  famille: IdFamilleTarifs | null;
  /** Identifiant du format choisi (« en-l ») ; null tant que rien n'est choisi. */
  format: string | null;
  tarifs: TarifsSite | null;
  /** Les zones du rendu (`rendu.references[].zone`). */
  zonesChoisies: readonly string[];
};

const arrondiCentaine = (n: number) => Math.round(n / 100) * 100;
const positif = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/** La fourchette de la pièce, lue dans `offre.ts`. */
export function repliDeLaFamille(famille: IdFamilleTarifs | null): Estimation {
  if (!famille) return { type: "sur-devis" };
  const f = FOURCHETTES[FOURCHETTE_DE_LA_FAMILLE[famille]];
  return f.min ? { type: "repli", famille, min: f.min, max: f.max } : { type: "sur-devis" };
}

/** Les formats proposés pour une famille (ceux du CRM ; aucun sans tarifs). */
export function formatsDeLaFamille(famille: IdFamilleTarifs | null, tarifs: TarifsSite | null): FormatPiece[] {
  return (famille && tarifs?.familles.find((f) => f.id === famille)?.formats.filter((x) => positif(x.metres))) || [];
}

/**
 * Les prix au mètre linéaire des sous-parties que les zones du rendu touchent — ou null dès qu'une zone n'est pas
 * chiffrable par la longueur (plan de travail, crédence, tablier…), qu'une sous-partie n'a pas de prix, ou qu'un prix
 * n'est pas au mètre linéaire : alors seule la fourchette de la pièce vaut, quelle que soit la taille.
 */
function prixAuMetre(famille: IdFamilleTarifs, tarifs: TarifsSite | null, zonesChoisies: readonly string[]): number[] | null {
  const tarifsFamille = tarifs?.familles.find((f) => f.id === famille);
  if (!tarifsFamille) return null;
  const table = ZONE_VERS_SOUS_PARTIE[famille];
  // Chaque zone choisie doit être chiffrable par la longueur ; une seule qui ne l'est pas → la fourchette de la pièce.
  if (zonesChoisies.length === 0 || zonesChoisies.some((z) => !table[z]?.length)) return null;
  const touchees = [...new Set(zonesChoisies.flatMap((z) => table[z]))];
  const lignes = touchees.map((id) => tarifsFamille.sousParties.find((s) => s.id === id));
  if (lignes.some((s) => !s || !s.metrage || !positif(s.prixUnitaire) || s.unite !== "ml")) return null;
  return lignes.map((s) => s!.prixUnitaire as number);
}

/**
 * La taille peut-elle changer l'estimation de ce rendu ? Seulement si le calcul aboutit (zones chiffrables, prix au
 * mètre linéaire) et que la famille a des formats. Sinon, « Quelle taille ? » serait un geste pour rien : la
 * fourchette de la pièce s'affiche tout de suite (mission 16, partie 4).
 */
export function estimationCalculable({ famille, tarifs, zonesChoisies }: Omit<EntreeEstimation, "format">): boolean {
  return !!famille && formatsDeLaFamille(famille, tarifs).length > 0 && prixAuMetre(famille, tarifs, zonesChoisies) !== null;
}

export function estimer({ famille, format, tarifs, zonesChoisies }: EntreeEstimation): Estimation {
  if (!famille) return { type: "sur-devis" };
  const repli = repliDeLaFamille(famille);
  const choisi = tarifs?.familles.find((f) => f.id === famille)?.formats.find((x) => x.id === format);
  if (!choisi || !positif(choisi.metres)) return repli;
  const prix = prixAuMetre(famille, tarifs, zonesChoisies);
  if (!prix) return repli;
  const total = prix.reduce((somme, p) => somme + p * choisi.metres, 0);
  const min = arrondiCentaine(total * (1 - MARGE_ESTIMATION));
  const max = Math.max(arrondiCentaine(total * (1 + MARGE_ESTIMATION)), min + 100);
  if (!positif(min) || !positif(max)) return repli;
  return { type: "calculee", famille, min, max, format: choisi };
}

/** « Estimation : 1 500 à 1 900 € » ; « Cuisine : 1 200 à 3 500 € » ; « Meubles : dès 250 € » ; « Prix sur devis ». */
export function texteEstimation(e: Estimation): string {
  if (e.type === "calculee") return `Estimation : ${euros(e.min).replace(/\s€$/, "")} à ${euros(e.max)}`;
  if (e.type === "repli") return `${NOM_DE_LA_FAMILLE[e.famille]} : ${e.max ? `${euros(e.min).replace(/\s€$/, "")} à ${euros(e.max)}` : `dès ${euros(e.min)}`}`;
  return "Prix sur devis";
}

/** La phrase fixe sous l'estimation. */
export const PRECISION_ESTIMATION = "Déplacement compris. Le devis exact suit vos photos.";

/** Ce que la demande de devis transmet au CRM : la fourchette vue et sa taille (rien pour « sur devis »). */
export function estimationPourEnvoi(e: Estimation | null): { estimationMin?: number; estimationMax?: number; formatPiece?: string } {
  if (!e || e.type === "sur-devis" || !e.max) return {};
  return { estimationMin: e.min, estimationMax: e.max, ...(e.type === "calculee" ? { formatPiece: `${e.format.libelle} · ${e.format.aide}`.slice(0, 40) } : {}) };
}
