import { track, type TrackEvent } from "@/lib/analytics";
import { obtenirParcoursId } from "@/lib/parcours";
import { lireOrigine, sourceCourte } from "@/lib/utm";

/**
 * Événements de parcours : envoyés au CRM (audience et entonnoir par source et
 * par page, sans donnée personnelle) et poussés dans le dataLayer pour Google
 * Tag Manager / Meta. Jamais bloquant : un échec d'envoi est ignoré.
 */
export type EvenementSite = "PAGE_VUE" | "SIMULATION_PHOTO" | "SIMULATION_LANCEE" | "SIMULATION_RESULTAT" | "SIMULATION_ECHEC" | "DEVIS_DEMANDE" | "CONTACT_ENVOYE" | "FORMULAIRE_ECHEC";

const VERS_DATALAYER: Partial<Record<EvenementSite, TrackEvent>> = {
  SIMULATION_PHOTO: "simulation_photo_uploaded",
  SIMULATION_LANCEE: "simulation_textures_selected",
  SIMULATION_RESULTAT: "simulation_generated",
  SIMULATION_ECHEC: "simulation_failed",
  DEVIS_DEMANDE: "devis_form_submitted",
  CONTACT_ENVOYE: "contact_form_submitted",
};

const URL_EVENEMENTS = (process.env.NEXT_PUBLIC_SIMULATE_URL || "").replace(/\/api\/simulate\/?$/, "/api/site/evenements");

export function envoyerEvenement(type: EvenementSite, meta: Record<string, string | number | boolean | undefined> = {}): void {
  if (typeof window === "undefined") return;
  const evenementDataLayer = VERS_DATALAYER[type];
  if (evenementDataLayer) track(evenementDataLayer, meta);
  if (!URL_EVENEMENTS) return;
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
      navigator.sendBeacon(URL_EVENEMENTS, new Blob([corps], { type: "application/json" }));
      return;
    }
    fetch(URL_EVENEMENTS, { method: "POST", headers: { "Content-Type": "application/json" }, body: corps, keepalive: true }).catch(() => undefined);
  } catch {
    /* jamais bloquant */
  }
}
