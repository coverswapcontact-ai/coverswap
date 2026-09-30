import { mesureRefuseeIci } from "@/lib/opposition-mesure";
import { obtenirParcoursId } from "@/lib/parcours";
import { lireOrigine, sourceCourte, utmDetailles, type Origine, type UtmDetailles } from "@/lib/utm";

/**
 * Événements de parcours : envoyés au CRM (audience et entonnoir par source et
 * par page, sans donnée personnelle, sans cookie). Jamais bloquant : un échec
 * d'envoi est ignoré. Mission 16 (partie 6) : plus rien vers un outil tiers
 * (GTM, GA4, pixel Meta, Clarity retirés du site) ; les conversions Meta
 * partent du CRM (API Conversions, côté serveur).
 *
 * Envoi en `text/plain` : une requête « simple », sans pré-vol CORS — un
 * sendBeacon en JSON serait silencieusement abandonné par le navigateur.
 *
 * Mission 17 (partie B) : mesure d'audience exemptée de consentement (CNIL),
 * sans cookie ni identifiant stable. Chaque événement porte en plus l'hôte du
 * site référent, le fuseau horaire du navigateur, les quatre utm et la seule
 * présence d'un `gclid` ; RIEN d'autre (ni écran, ni langue, ni identifiant
 * nouveau). Le CRM en déduit seul, à la réception, le visiteur du jour (empreinte
 * au sel quotidien détruit, IP et navigateur jamais gardés), la classe
 * d'appareil (en-tête User-Agent) et le pays (depuis le fuseau). Rien ne part
 * si la personne s'y oppose (bouton « Ne pas compter mes visites » ou signal
 * Global Privacy Control : `lib/opposition-mesure.ts`).
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

type Meta = Record<string, string | number | boolean | undefined>;

export type CorpsEvenement = {
  parcoursId: string;
  type: EvenementSite;
  page: string;
  /** La source courte (utm_source[/medium] ou hôte référent), comme avant la mission 17 : les familles du CRM la lisent. */
  source: string | null;
  campagne: string | null;
  referent: string | null;
  fuseau: string | null;
  utm: UtmDetailles;
  gclid: boolean;
  meta: Meta | null;
};

/** Pur : le corps envoyé au CRM (testé par evenements-site.test.ts). */
export function corpsEvenement(type: EvenementSite, meta: Meta, contexte: { parcoursId: string; page: string; origine: Origine; fuseau: string | null }): CorpsEvenement {
  const { origine } = contexte;
  return {
    parcoursId: contexte.parcoursId,
    type,
    page: contexte.page,
    source: sourceCourte(origine) ?? null,
    campagne: origine.campagne,
    referent: origine.referent,
    fuseau: contexte.fuseau,
    utm: utmDetailles(origine),
    gclid: origine.gclid,
    meta: Object.keys(meta).length ? meta : null,
  };
}

/** Le fuseau horaire du navigateur (« Europe/Paris ») ; le CRM en déduit un pays, sans géolocalisation. */
export function fuseauHoraire(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Envoie un événement à `url` ; rend false quand rien ne part (côté serveur, adresse vide, mesure refusée).
 * Séparé de `envoyerEvenement` pour être testé avec une adresse (celle du site vient d'une variable de build).
 */
export function envoyerVers(url: string, type: EvenementSite, meta: Meta = {}): boolean {
  if (typeof window === "undefined" || !url) return false;
  if (mesureRefuseeIci()) return false;
  const corps = JSON.stringify(corpsEvenement(type, meta, { parcoursId: obtenirParcoursId(), page: window.location.pathname, origine: lireOrigine(), fuseau: fuseauHoraire() }));
  try {
    if (navigator.sendBeacon && type !== "PAGE_VUE") {
      // Beacon : part même si la page se ferme (demande de devis, échec)
      if (navigator.sendBeacon(url, new Blob([corps], { type: "text/plain" }))) return true;
    }
    fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: corps, keepalive: true }).catch(() => undefined);
  } catch {
    /* jamais bloquant */
  }
  return true;
}

export function envoyerEvenement(type: EvenementSite, meta: Meta = {}): void {
  envoyerVers(URL_EVENEMENTS, type, meta);
}
