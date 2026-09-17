/**
 * Choix de cookies du visiteur : par finalité, daté, conservé 6 mois dans le
 * navigateur (localStorage). Lu par le bandeau (CookieBanner) et par les
 * traceurs (Analytics) ; modifiable à tout moment via « Gérer les cookies ».
 */
export type ChoixCookies = {
  version: number;
  date: string;
  /** Mesure d'audience : Google Tag Manager / Analytics. */
  audience: boolean;
  /** Publicité et réseaux sociaux : pixel Meta, Microsoft Clarity. */
  publicite: boolean;
};

export const CLE_CHOIX_COOKIES = "cookie-consent";
export const VERSION_CHOIX = 2;
const VALIDITE_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export const EVENEMENT_CHANGEMENT = "cookie-consent-change";
export const EVENEMENT_OUVERTURE = "cookie-consent-open";

export const FINALITES: { cle: keyof Pick<ChoixCookies, "audience" | "publicite">; libelle: string; detail: string }[] = [
  {
    cle: "audience",
    libelle: "Mesure d'audience",
    detail: "Google Tag Manager et Google Analytics : pages vues, parcours, provenance des visites. Nous aide à améliorer le site.",
  },
  {
    cle: "publicite",
    libelle: "Publicité et réseaux sociaux",
    detail: "Pixel Meta (Facebook, Instagram) et Microsoft Clarity : mesure de nos campagnes et analyse d'usage. Jamais actifs sans votre accord.",
  },
];

export function lireChoixCookies(): ChoixCookies | null {
  try {
    const brut = localStorage.getItem(CLE_CHOIX_COOKIES);
    if (!brut) return null;
    // Anciennes valeurs (« accepted » / « refused ») : converties, puis redemandées à l'expiration.
    if (brut === "accepted" || brut === "refused") {
      const tout = brut === "accepted";
      return { version: 1, date: new Date(0).toISOString(), audience: tout, publicite: tout };
    }
    const choix = JSON.parse(brut) as ChoixCookies;
    if (typeof choix !== "object" || choix === null || typeof choix.audience !== "boolean") return null;
    if (Date.now() - new Date(choix.date).getTime() > VALIDITE_MS) return null;
    return choix;
  } catch {
    return null;
  }
}

export function enregistrerChoixCookies(choix: Pick<ChoixCookies, "audience" | "publicite">): ChoixCookies {
  const complet: ChoixCookies = { version: VERSION_CHOIX, date: new Date().toISOString(), ...choix };
  try {
    localStorage.setItem(CLE_CHOIX_COOKIES, JSON.stringify(complet));
  } catch {
    /* stockage indisponible : le choix vaut pour la page */
  }
  window.dispatchEvent(new Event(EVENEMENT_CHANGEMENT));
  return complet;
}

export function ouvrirChoixCookies() {
  window.dispatchEvent(new Event(EVENEMENT_OUVERTURE));
}
