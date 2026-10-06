import { DELAI_REPONSE, DUREE_POSE_TEXTE, PRIX_PLAGE } from "@/lib/offre";
import { LONGUEUR_MAX_DESCRIPTION, LONGUEUR_MAX_TITRE } from "@/lib/metadonnees";

/**
 * Les titles et descriptions des pages de zone (site 3.0, lot F2 ; `docs/SEO.md`, carte des intentions) : une ville
 * porte « covering adhésif <ville> » toutes prestations confondues (« covering cuisine Montpellier » est la page de la
 * prestation cuisine) ; `/zones` porte l'Hérault et le Gard. Le plus complet qui tient en 60 caractères (155 pour la
 * description), sans majuscule à chaque mot. Pur, testé (`metadonnees.test.ts`).
 */
export const TITRE_ZONES = "Covering adhésif dans l'Hérault et le Gard | CoverSwap";

export function titreVille(ville: string): string {
  const candidats = [`Covering adhésif à ${ville}, sans travaux | CoverSwap`, `Covering adhésif à ${ville} | CoverSwap`];
  return candidats.find((t) => t.length <= LONGUEUR_MAX_TITRE) ?? candidats[candidats.length - 1];
}

export function descriptionVille(ville: string, codePostal: string): string {
  const cp = codePostal.split(" / ")[0];
  const candidats = [
    `Covering adhésif à ${ville} (${cp}) : cuisine, salle de bain et meubles rénovés en ${DUREE_POSE_TEXTE}, sans travaux. Devis gratuit ${DELAI_REPONSE}, ${PRIX_PLAGE}.`,
    `Covering adhésif à ${ville} (${cp}) : cuisine, salle de bain et meubles rénovés en ${DUREE_POSE_TEXTE}, sans travaux. Devis ${DELAI_REPONSE}, ${PRIX_PLAGE}.`,
    `Covering adhésif à ${ville} : cuisine, salle de bain et meubles rénovés en ${DUREE_POSE_TEXTE}, sans travaux. Devis ${DELAI_REPONSE}.`,
  ];
  return candidats.find((d) => d.length <= LONGUEUR_MAX_DESCRIPTION) ?? candidats[candidats.length - 1];
}

/** La description de `/zones` : les villes dans l'ordre de la page, puis ce qu'on y fait. */
export function descriptionZones(villes: readonly string[]): string {
  const liste = villes.length > 1 ? `${villes.slice(0, -1).join(", ")} et ${villes[villes.length - 1]}` : villes.join("");
  return `On pose à ${liste} : cuisine, salle de bain et meubles rénovés sans travaux.`;
}
