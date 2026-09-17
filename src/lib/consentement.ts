/**
 * Consentement aux e-mails commerciaux, recueilli par une case distincte,
 * jamais pré-cochée, sur chaque formulaire du site.
 *
 * Le texte est figé ici : c'est la preuve transmise au CRM
 * (`consentementTexte`), horodatée au moment de l'envoi. Ne pas le modifier
 * sans le versionner — un consentement vaut pour le texte qui a été coché.
 */
export const TEXTE_CONSENTEMENT_MAIL =
  "J'accepte de recevoir par e-mail les conseils, nouveautés et offres de CoverSwap. Je peux me désinscrire à tout moment (lien en bas de chaque e-mail).";

export const VERSION_CONSENTEMENT = "2026-09-17";

/** Champs joints à tout envoi vers le CRM. */
export function consentementPourEnvoi(coche: boolean, formulaire: string): { consentementMail: boolean; consentementTexte: string } {
  const quand = new Date().toISOString();
  return {
    consentementMail: coche,
    consentementTexte: `${coche ? "Case cochée" : "Case non cochée"} le ${quand} — formulaire ${formulaire} — texte v${VERSION_CONSENTEMENT} : « ${TEXTE_CONSENTEMENT_MAIL} »`,
  };
}
