/**
 * L'onglet Devis de l'espace client (mission 18, B7) — quels devis montrer, et pour quoi faire. PUR (sans DOM ni
 * réseau, testé par devis.test.ts). Le CRM calcule ce qui se signe (`devisASigner`) ; le site ne fait que l'afficher.
 * Un état gardé dans le téléphone avant B7 (ou un CRM d'avant) n'a pas ce champ : le calcul d'avant le remplace
 * (une fois l'accord donné, seul le devis signé).
 */

import type { Devis, Etat } from "@/components/espace/api";

export type DevisDeLOnglet = {
  /** Les devis signés (accord donné, ou signé hors de l'espace) : le devis d'origine, puis les avenants signés. */
  signes: Devis[];
  /** Ceux qu'il peut signer maintenant (avant la signature : les devis proposés ; après : les avenants). */
  aSigner: Devis[];
  /** Signé, et un avenant (ou un nouveau devis) l'attend : il se signe à côté du devis d'origine, qui reste valable. */
  avenant: boolean;
  /** Ce que l'onglet affiche, côte à côte s'il y en a plusieurs : d'abord ce qui se signe, puis ce qui est signé. */
  liste: Devis[];
  /** Le devis ouvert d'emblée (null : plusieurs à comparer, il en touche un). */
  ouvert: Devis | null;
};

export function devisDeLOnglet(etat: Pick<Etat, "devis" | "devisProposes" | "devisASigner">): DevisDeLOnglet {
  const signes = (etat.devisProposes ?? []).filter((d) => d.accepte);
  if (etat.devis?.accepte && !signes.some((d) => d.id === etat.devis!.id)) signes.unshift(etat.devis);
  const aSigner = etat.devisASigner ?? (signes.length ? [] : etat.devisProposes?.length ? etat.devisProposes : etat.devis ? [etat.devis] : []);
  const avenant = signes.length > 0 && aSigner.length > 0;
  const liste = [...aSigner, ...signes.filter((d) => !aSigner.some((a) => a.id === d.id))];
  if (liste.length === 0 && etat.devis) liste.push(etat.devis);
  // Un avenant à signer s'ouvre directement (seul) ; un seul devis en tout aussi ; sinon il compare et en touche un.
  const ouvert = avenant ? (aSigner.length === 1 ? aSigner[0] : null) : liste.length === 1 ? liste[0] : null;
  return { signes, aSigner, avenant, liste, ouvert };
}

/** Le titre et la phrase de la rangée de devis côte à côte, selon ce qu'il a à faire. */
export function enteteDesDevis(choix: Pick<DevisDeLOnglet, "signes" | "aSigner" | "avenant" | "liste">): { surtitre: string; phrase: string } {
  if (choix.avenant)
    return choix.aSigner.length > 1
      ? { surtitre: `${choix.aSigner.length} nouveaux devis vous sont proposés`, phrase: "Votre devis signé reste valable. Comparez, puis donnez votre accord sur celui qui vous convient : un seul sera retenu." }
      : { surtitre: "Un nouveau devis vous est proposé", phrase: "Votre devis signé reste valable. Lisez le nouveau, puis donnez votre accord ici." };
  if (choix.aSigner.length === 0) return { surtitre: choix.signes.length > 1 ? "Vos devis signés" : "Votre devis signé", phrase: "Touchez un devis pour le relire." };
  return { surtitre: `${choix.liste.length} devis vous sont proposés`, phrase: "Comparez, puis donnez votre accord sur celui qui vous convient. Un seul sera retenu." };
}

/** Ce que précise la case « J'accepte » : les autres devis à signer ne seront pas retenus ; le devis signé, lui, reste. */
export function precisionAccord(choix: Pick<DevisDeLOnglet, "signes" | "aSigner" | "avenant">): string {
  const autres = choix.aSigner.length > 1 ? " Les autres devis proposés ne seront pas retenus." : "";
  return choix.avenant ? `${autres} Votre devis signé n° ${choix.signes[0].numero} reste valable.` : autres;
}
