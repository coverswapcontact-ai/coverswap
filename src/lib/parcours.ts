/**
 * Identifiant de parcours : un visiteur qui simule puis demande un devis (ou
 * revient au formulaire) reste un seul contact dans le CRM. Généré une fois par
 * navigateur (sessionStorage), joint à chaque envoi ; jamais présenté comme
 * une identité, il ne sert qu'au rattachement.
 */
const CLE = "coverswap_parcours";

export function obtenirParcoursId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existant = sessionStorage.getItem(CLE);
    if (existant && /^[0-9a-f-]{36}$/.test(existant)) return existant;
    const nouveau = crypto.randomUUID();
    sessionStorage.setItem(CLE, nouveau);
    return nouveau;
  } catch {
    return "";
  }
}

/** Côté serveur : un identifiant bien formé ou rien. */
export function parcoursIdValide(valeur: unknown): string | undefined {
  return typeof valeur === "string" && /^[0-9a-fA-F-]{16,64}$/.test(valeur) ? valeur : undefined;
}
