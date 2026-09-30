/**
 * Origine de la visite, mémorisée à l'arrivée pour tout l'onglet (sessionStorage,
 * meurt avec lui) et jointe aux envois vers le CRM : campagne, publicité, page
 * d'entrée, site référent.
 *
 * Mission 17 (partie B) : les événements portent aussi l'origine détaillée —
 * les quatre utm, l'hôte du site référent (sans chemin, sans `www.`, rien si
 * la visite vient de coverswap.fr) et la seule PRÉSENCE d'un `gclid` (jamais
 * sa valeur : c'est l'identifiant d'un clic Google Ads). Tout se lit une seule
 * fois, à la première page de l'onglet. Fonctions pures (`origineDepuis`,
 * `referentDe`, `sourceCourte`, `utmDetailles`) testées par `utm.test.ts`.
 */
const CLE = "coverswap_origine";

export type Origine = {
  source: string | null;
  medium: string | null;
  campagne: string | null;
  contenu: string | null;
  entree: string | null;
  /** Hôte du site d'où vient la visite, sans `www.` ; null si direct ou depuis coverswap.fr. */
  referent: string | null;
  /** Un `gclid` était dans l'adresse d'arrivée (clic Google Ads) ; la valeur n'est jamais gardée. */
  gclid: boolean;
};

export type UtmDetailles = { source: string | null; medium: string | null; campagne: string | null; contenu: string | null };

const ORIGINE_VIDE: Origine = { source: null, medium: null, campagne: null, contenu: null, entree: null, referent: null, gclid: false };

const estCoverswap = (hote: string) => /(^|\.)coverswap\.fr$/.test(hote);

/** Un hôte réduit : minuscules, sans `www.` ; null s'il est vide ou si c'est coverswap.fr (ou un de ses sous-domaines). */
function hoteReduit(hote: string | null | undefined): string | null {
  const h = (hote ?? "").trim().toLowerCase().replace(/^www\./, "");
  return h && !estCoverswap(h) ? h : null;
}

/** L'hôte du référent (`document.referrer`), sans chemin ni `www.` ; null si absent, illisible ou coverswap.fr. */
export function referentDe(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return hoteReduit(new URL(referrer).hostname);
  } catch {
    return null;
  }
}

/** L'origine d'une arrivée, d'après l'adresse (`location.search`, `location.pathname`) et `document.referrer`. */
export function origineDepuis(recherche: string, chemin: string, referrer: string | null | undefined): Origine {
  const q = new URLSearchParams(recherche);
  return {
    source: q.get("utm_source"),
    medium: q.get("utm_medium"),
    campagne: q.get("utm_campaign"),
    contenu: q.get("utm_content"),
    entree: chemin || null,
    referent: referentDe(referrer),
    gclid: q.has("gclid"),
  };
}

export function memoriserOrigine(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(CLE)) return;
    sessionStorage.setItem(CLE, JSON.stringify(origineDepuis(window.location.search, window.location.pathname, document.referrer)));
  } catch {
    /* stockage indisponible */
  }
}

export function lireOrigine(): Origine {
  if (typeof window === "undefined") return ORIGINE_VIDE;
  try {
    const brut = sessionStorage.getItem(CLE);
    if (!brut) return ORIGINE_VIDE;
    const lue = { ...ORIGINE_VIDE, ...(JSON.parse(brut) as Partial<Origine>) };
    // Un onglet ouvert avant la mission 17 garde l'hôte brut (avec `www.`, parfois coverswap.fr) et pas de gclid.
    return { ...lue, referent: hoteReduit(lue.referent), gclid: lue.gclid === true };
  } catch {
    return ORIGINE_VIDE;
  }
}

/** Libellé court de la source pour le CRM : utm_source[/utm_medium], sinon le site référent, sinon rien. */
export function sourceCourte(origine: Pick<Origine, "source" | "medium" | "referent">): string | undefined {
  if (origine.source) return origine.medium ? `${origine.source}/${origine.medium}` : origine.source;
  return hoteReduit(origine.referent) ?? undefined;
}

/** Les quatre utm, séparés (la source courte les mélange). */
export function utmDetailles(origine: Pick<Origine, "source" | "medium" | "campagne" | "contenu">): UtmDetailles {
  return { source: origine.source, medium: origine.medium, campagne: origine.campagne, contenu: origine.contenu };
}

/** Champs d'acquisition joints aux envois vers le CRM. */
export function acquisitionPourEnvoi(): { campagne?: string; publicite?: string; canal?: string; pageEntree?: string } {
  const o = lireOrigine();
  return {
    campagne: o.campagne ?? undefined,
    publicite: o.contenu ?? undefined,
    canal: sourceCourte(o),
    pageEntree: o.entree ?? undefined,
  };
}
