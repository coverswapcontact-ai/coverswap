/**
 * Tracking helpers — fire events vers Google Analytics 4, Meta Pixel
 * et Microsoft Clarity en une seule API.
 *
 * Tous les appels sont safe : si l'utilisateur a refusé les cookies
 * ou si les scripts ne sont pas chargés, on no-op silencieusement.
 *
 * Usage :
 *   import { track } from "@/lib/analytics";
 *   track("simulation_photo_uploaded", { source: "home" });
 */

/* ──────────────────────────────────────────────────────────────────
   TYPES
────────────────────────────────────────────────────────────────── */
export type TrackEvent =
  | "simulation_photo_uploaded"     // utilisateur upload une photo (home OU /simulation)
  | "simulation_textures_selected"  // utilisateur a choisi au moins 1 texture
  | "simulation_generated"          // génération IA réussie
  | "simulation_failed"             // génération IA échouée
  | "devis_form_submitted"          // formulaire devis envoyé
  | "contact_form_submitted"        // formulaire contact envoyé
  | "whatsapp_clicked"              // clic sur le bouton WhatsApp flottant
  | "phone_clicked"                 // clic sur un lien tel:
  | "email_clicked"                 // clic sur un lien mailto:
  | "simulation_downloaded"          // téléchargement du document projet
  | "cta_clicked";                  // clic sur n'importe quel CTA tracké

interface TrackParams {
  [key: string]: string | number | boolean | undefined;
}

/* ──────────────────────────────────────────────────────────────────
   GLOBAL DECLARATIONS
────────────────────────────────────────────────────────────────── */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/* ──────────────────────────────────────────────────────────────────
   Mapping events → Meta Pixel standard events
────────────────────────────────────────────────────────────────── */
const META_EVENT_MAP: Partial<Record<TrackEvent, string>> = {
  simulation_photo_uploaded: "InitiateCheckout",
  simulation_generated: "Lead",
  devis_form_submitted: "Lead",
  contact_form_submitted: "Contact",
  whatsapp_clicked: "Contact",
  phone_clicked: "Contact",
};

/* ──────────────────────────────────────────────────────────────────
   API publique
────────────────────────────────────────────────────────────────── */
export function track(event: TrackEvent, params: TrackParams = {}): void {
  if (typeof window === "undefined") return;

  // 1) GTM dataLayer (prioritaire — GA4/Ads/etc. configurés dans GTM)
  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...params });
    }
  } catch {
    /* no-op */
  }

  // 2) Google Analytics 4 (fallback direct si pas de GTM)
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, params);
    }
  } catch {
    /* no-op */
  }

  // 2) Meta Pixel (utilise event mapping)
  try {
    if (typeof window.fbq === "function") {
      const metaEvent = META_EVENT_MAP[event];
      if (metaEvent) {
        window.fbq("track", metaEvent, params);
      } else {
        window.fbq("trackCustom", event, params);
      }
    }
  } catch {
    /* no-op */
  }

  // 3) Microsoft Clarity (custom tag pour filtrer les sessions)
  try {
    if (typeof window.clarity === "function") {
      window.clarity("event", event);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          window.clarity!("set", key, String(value));
        }
      });
    }
  } catch {
    /* no-op */
  }

  // Dev log
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[track] ${event}`, params);
  }
}

/**
 * Page view manuel — utile si tu veux tracker un changement de step
 * dans le simulateur comme une "virtual page".
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: path,
        page_title: title,
      });
    }
  } catch {
    /* no-op */
  }
  try {
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  } catch {
    /* no-op */
  }
}
