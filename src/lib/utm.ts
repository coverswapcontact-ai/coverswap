/**
 * Origine de la visite (utm_*), mémorisée à l'arrivée pour toute la session et
 * jointe aux envois vers le CRM : campagne, publicité, page d'entrée.
 */
const CLE = "coverswap_origine";

export type Origine = { source: string | null; medium: string | null; campagne: string | null; contenu: string | null; entree: string | null; referent: string | null };

export function memoriserOrigine(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(CLE)) return;
    const q = new URLSearchParams(window.location.search);
    const origine: Origine = {
      source: q.get("utm_source"),
      medium: q.get("utm_medium"),
      campagne: q.get("utm_campaign"),
      contenu: q.get("utm_content"),
      entree: window.location.pathname,
      referent: document.referrer ? new URL(document.referrer).hostname : null,
    };
    sessionStorage.setItem(CLE, JSON.stringify(origine));
  } catch {
    /* stockage indisponible */
  }
}

export function lireOrigine(): Origine {
  const vide: Origine = { source: null, medium: null, campagne: null, contenu: null, entree: null, referent: null };
  if (typeof window === "undefined") return vide;
  try {
    const brut = sessionStorage.getItem(CLE);
    return brut ? { ...vide, ...(JSON.parse(brut) as Partial<Origine>) } : vide;
  } catch {
    return vide;
  }
}

/** Libellé court de la source pour le CRM : utm_source, sinon le site référent, sinon rien. */
export function sourceCourte(origine: Origine): string | undefined {
  if (origine.source) return origine.medium ? `${origine.source}/${origine.medium}` : origine.source;
  if (origine.referent && !/coverswap\.fr$/.test(origine.referent)) return origine.referent.replace(/^www\./, "");
  return undefined;
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
