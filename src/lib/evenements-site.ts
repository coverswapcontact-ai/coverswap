import { obtenirParcoursId } from "@/lib/parcours";
import { lireOrigine, sourceCourte } from "@/lib/utm";

/**
 * Événements de parcours : envoyés au CRM (audience et entonnoir par source et
 * par page, sans donnée personnelle, sans cookie). Jamais bloquant : un échec
 * d'envoi est ignoré. Mission 16 (partie 6) : plus rien vers un outil tiers
 * (GTM, GA4, pixel Meta, Clarity retirés du site) ; les conversions Meta
 * partent du CRM (API Conversions, côté serveur).
 *
 * Envoi en `text/plain` : une requête « simple », sans pré-vol CORS — un
 * sendBeacon en JSON serait silencieusement abandonné par le navigateur.
 */
/** Mission 15 (partie 4) : l'entonnoir du simulateur = PIECE_CHOISIE → PHOTO_CHARGEE → GENERATION_LANCEE → RESULTAT_VU → DEVIS_DEMANDE (mêmes noms côté CRM). */
/** Mission 16 (partie 3) : `WHATSAPP_CLIQUE`, le bouton « Écrire sur WhatsApp » (liste blanche du CRM d'abord). */
/** Mission 16 (partie 4) : `ESTIMATION_VUE` (la fourchette affichée après le rendu) et `RAPPEL_DEMANDE` (un créneau choisi). */
export type EvenementSite = "PAGE_VUE" | "PIECE_CHOISIE" | "PHOTO_CHARGEE" | "GENERATION_LANCEE" | "RESULTAT_VU" | "ESTIMATION_VUE" | "SIMULATION_ECHEC" | "DEVIS_DEMANDE" | "CONTACT_ENVOYE" | "RAPPEL_DEMANDE" | "FORMULAIRE_ECHEC" | "WHATSAPP_CLIQUE";

/**
 * L'adresse des événements du CRM, déduite de `NEXT_PUBLIC_SIMULATE_URL` ; vide (rien n'est envoyé) sans elle, ou
 * quand `NEXT_PUBLIC_SANS_EVENEMENTS=1` : l'intégration continue (Lighthouse, captures) lit le CRM de production
 * sans y écrire — le CRM refuserait de toute façon l'origine `localhost`, et le refus CORS salirait la console.
 */
export function urlEvenements(simulateUrl: string | undefined, sansEvenements: string | undefined): string {
  if (sansEvenements === "1") return "";
  return (simulateUrl || "").replace(/\/api\/simulate\/?$/, "/api/site/evenements");
}

const URL_EVENEMENTS = urlEvenements(process.env.NEXT_PUBLIC_SIMULATE_URL, process.env.NEXT_PUBLIC_SANS_EVENEMENTS);

export function envoyerEvenement(type: EvenementSite, meta: Record<string, string | number | boolean | undefined> = {}): void {
  if (typeof window === "undefined" || !URL_EVENEMENTS) return;
  const origine = lireOrigine();
  const corps = JSON.stringify({
    parcoursId: obtenirParcoursId(),
    type,
    page: window.location.pathname,
    source: sourceCourte(origine) ?? null,
    campagne: origine.campagne,
    meta: Object.keys(meta).length ? meta : null,
  });
  try {
    if (navigator.sendBeacon && type !== "PAGE_VUE") {
      // Beacon : part même si la page se ferme (demande de devis, échec)
      if (navigator.sendBeacon(URL_EVENEMENTS, new Blob([corps], { type: "text/plain" }))) return;
    }
    fetch(URL_EVENEMENTS, { method: "POST", headers: { "Content-Type": "text/plain" }, body: corps, keepalive: true }).catch(() => undefined);
  } catch {
    /* jamais bloquant */
  }
}
