import { TIROIRS, estFamille } from "./familles-matieres";

/**
 * « La voir en vrai chez moi » (site 3.0, lots D3 et D4) : la demande de visite avec échantillons passe par le
 * formulaire de `/contact`, prérempli par l'adresse. Module léger (lu par le formulaire, côté client), pur, testé
 * (`src/app/matieres/fiches.test.ts`).
 *  - `lienVisiteMatiere(ref)` : `/contact?ref=<REF>&visite=1` (une fiche de matière) ; la référence est montrée et
 *    envoyée par le formulaire (« Référence sélectionnée »), comme avant ;
 *  - `lienVisiteFamille(famille)` : `/contact?visite=1&famille=<id>` (une page de famille) ;
 *  - `messageVisite` : le message prérempli quand l'adresse porte `visite=1` — la référence, ou les échantillons de la
 *    famille, sinon une visite en général. Rien n'est envoyé tout seul : la personne relit, complète et envoie.
 */
export const lienVisiteMatiere = (ref: string) => `/contact?ref=${encodeURIComponent(ref)}&visite=1`;

export const lienVisiteFamille = (famille: string) => `/contact?visite=1&famille=${encodeURIComponent(famille)}`;

/** Une référence lisible (lettres, chiffres, tirets) : une adresse bricolée ne glisse rien d'autre dans le message. */
const REF_LISIBLE = /^[A-Za-z0-9_-]{1,24}$/;

export function messageVisite(parametres: URLSearchParams): string | null {
  if (parametres.get("visite") !== "1") return null;
  const ref = parametres.get("ref")?.trim();
  const famille = parametres.get("famille");
  const debut = "Bonjour, j'aimerais voir";
  const fin = "Pouvez-vous passer avec les échantillons ? Voici mon projet :";
  if (ref && REF_LISIBLE.test(ref)) return `${debut} la matière ${ref} en vrai, chez moi, à côté de mes meubles. ${fin} `;
  if (estFamille(famille)) return `${debut} vos ${TIROIRS[famille].toLowerCase()} en vrai, chez moi, à côté de mes meubles. ${fin} `;
  return `${debut} vos matières en vrai, chez moi. ${fin} `;
}
