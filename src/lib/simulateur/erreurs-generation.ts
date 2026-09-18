/**
 * Ce que le visiteur lit quand la génération échoue. Une panne de notre côté
 * (crédit épuisé, clé refusée, service en panne) ne doit jamais être présentée
 * comme un défaut de sa photo ; et dans tous les cas la photo reste en mémoire
 * et la personne peut laisser ses coordonnées (voir Simulateur, étape 2).
 *
 * Le CRM classe les erreurs de la même façon (crm : src/lib/site/erreurs-generation.ts).
 */
export type RaisonEchec = "service-indisponible" | "photo-refusee" | "surcharge" | "delai" | "erreur";

export const MESSAGES_ECHEC: Record<RaisonEchec, string> = {
  "service-indisponible":
    "Le simulateur est momentanément indisponible de notre côté — ni votre photo ni votre connexion ne sont en cause. Votre photo et vos choix sont conservés : laissez-nous vos coordonnées, nous réalisons la simulation pour vous et vous l'envoyons avec votre devis.",
  "photo-refusee": "Cette photo n'a pas pu être traitée (trop sombre, floue, ou contenu refusé par le service d'image). Essayez une autre photo, de face et bien éclairée — ou laissez-nous vos coordonnées, nous ferons la simulation pour vous.",
  surcharge: "Le service d'image est très sollicité à l'instant. Votre photo et vos choix sont conservés : réessayez dans une minute, ou laissez-nous vos coordonnées et nous vous envoyons la simulation.",
  delai: "La génération a pris trop de temps. Votre photo et vos choix sont conservés : réessayez, ou laissez-nous vos coordonnées et nous vous envoyons la simulation.",
  erreur: "La génération n'a pas abouti. Votre photo et vos choix sont conservés : réessayez, ou laissez-nous vos coordonnées et nous vous envoyons la simulation.",
};

/** Classe une réponse d'erreur de l'API d'images d'OpenAI (statut HTTP + corps brut). */
export function classerErreurOpenAI(statut: number | undefined, corps: string | undefined): RaisonEchec {
  const texte = (corps ?? "").toLowerCase();
  // Crédit épuisé, plafond de facturation, compte inactif, clé refusée, organisation non vérifiée : c'est chez nous.
  if (/insufficient_quota|credit_balance|no credits|billing|exceeded your current quota|account_deactivated|invalid_api_key|incorrect api key|must be verified|access_terminated/.test(texte)) return "service-indisponible";
  if (statut === 401 || statut === 403) return "service-indisponible";
  if (statut === 429) return "surcharge";
  if (statut === 400) return /moderation|safety|content_policy|invalid_image|image_|unsupported|too large|could not process/.test(texte) ? "photo-refusee" : "erreur";
  if (statut !== undefined && statut >= 500) return "surcharge";
  return "erreur";
}
