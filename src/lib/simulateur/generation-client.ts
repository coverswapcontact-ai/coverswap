import { ATTENTE_PAR_DEFAUT_S, MESSAGE_INJOIGNABLE, TEXTE_CONSENTEMENT_PREVENIR, type EvenementSondage, type ReponseAnalyseCrm, type ReponseSuivi } from "./reprise";

/**
 * Le navigateur parle au CRM (mission 15, partie 4) : le site n'est plus qu'un
 * client. `prepare` (sur le site : captcha, validation, signature des
 * sélections) → `POST <CRM>/api/simulate` avec la photo (jamais par une route
 * du site) → suivi par sondage. L'analyse de la photo se demande dès son
 * chargement (`/api/simulate/analyse`) ; un HEIC que le navigateur ne décode
 * pas est converti par le CRM (`/api/simulate/photo`) ; les vignettes du
 * catalogue viennent du CRM (`/api/site/echantillons`). Plus aucun repli sur
 * Vercel : si le CRM ne répond pas, on le dit honnêtement, la photo reste.
 */

export const SIMULATE_URL = process.env.NEXT_PUBLIC_SIMULATE_URL ?? "";

/**
 * Raisons pour lesquelles réessayer TOUT DE SUITE ne sert à rien : la demande par coordonnées passe devant.
 * Un refus `captcha` n'en fait pas partie : le widget Turnstile est réinitialisé après chaque appel, un nouvel essai
 * part avec un jeton neuf. Dans tous les cas, l'écran d'échec laisse revenir aux matières (Simulateur.tsx).
 */
export const PANNES = ["service-indisponible", "global-quota", "ip-quota", "quota", "non-configure"];

export const MESSAGE_NON_CONFIGURE = "Le simulateur n'est pas disponible pour l'instant. Votre photo et vos choix sont conservés : laissez-nous vos coordonnées, nous ferons la simulation pour vous.";

export function baseCrm(): string {
  return SIMULATE_URL.replace(/\/api\/simulate\/?$/, "");
}

export function urlImageTravail(travailId: string, parcoursId: string, quoi: "apres" | "avant"): string {
  return `${SIMULATE_URL}/image?id=${encodeURIComponent(travailId)}&p=${encodeURIComponent(parcoursId)}&quoi=${quoi}`;
}

/** Vignette de 320 px d'un échantillon (grille du catalogue), servie et mise en cache par le CRM. */
export function urlVignette(ref: string): string {
  return `${baseCrm()}/api/site/echantillons/${encodeURIComponent(ref)}?l=320`;
}

/** L'échantillon entier (« voir en grand »). */
export function urlEchantillon(ref: string): string {
  return `${baseCrm()}/api/site/echantillons/${encodeURIComponent(ref)}`;
}

export type Lancement = { ok: true; travailId: string; attenteEstimeeS: number } | { ok: false; raison: string; message: string; zones?: string[] };

export type EntreeLancement = {
  projetId: string;
  parcoursId: string;
  turnstileToken: string | null;
  selections: { surface: string; ref: string }[];
  photo: string;
  page: string;
  source: string | null;
  campagne: string | null;
};

async function lireJson(reponse: Response | null): Promise<Record<string, unknown>> {
  if (!reponse) return {};
  try {
    return (await reponse.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
const texte = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

export async function lancerGeneration(entree: EntreeLancement): Promise<Lancement> {
  if (!SIMULATE_URL) return { ok: false, raison: "non-configure", message: MESSAGE_NON_CONFIGURE };
  // 1) Préparation sur le site (captcha, validation, signature) — un jeton Turnstile par appel serveur.
  const prep = await fetch("/api/simulation/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_type: entree.projetId, parcoursId: entree.parcoursId, turnstileToken: entree.turnstileToken, selections: entree.selections }),
  }).catch(() => null);
  const prepData = await lireJson(prep);
  if (!prep) return { ok: false, raison: "reseau", message: MESSAGE_INJOIGNABLE };
  if (prep.status === 503) return { ok: false, raison: "non-configure", message: MESSAGE_NON_CONFIGURE };
  if (!prep.ok || typeof prepData.sig !== "string" || !Array.isArray(prepData.selections)) {
    return { ok: false, raison: texte(prepData.reason) ?? `prepare-${prep.status}`, message: texte(prepData.error) ?? "Simulation refusée pour le moment. Votre photo et vos choix sont conservés." };
  }

  // 2) Le CRM crée le travail et répond tout de suite ; la photo va du navigateur au CRM, jamais par le site.
  const gen = await fetch(SIMULATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asynchrone: true,
      projet: prepData.projet,
      selections: prepData.selections,
      sig: prepData.sig,
      exp: prepData.exp,
      parcoursId: entree.parcoursId,
      page: entree.page,
      source: entree.source,
      campagne: entree.campagne,
      photo_base64: entree.photo,
    }),
  }).catch(() => null);
  const genData = await lireJson(gen);
  if (!gen || gen.status >= 500) return { ok: false, raison: gen ? `crm-${gen.status}` : "reseau", message: texte(genData.error) ?? MESSAGE_INJOIGNABLE };
  if (gen.status === 202 && typeof genData.travailId === "string") {
    return { ok: true, travailId: genData.travailId, attenteEstimeeS: typeof genData.attenteEstimeeS === "number" ? genData.attenteEstimeeS : ATTENTE_PAR_DEFAUT_S };
  }
  if (gen.status === 429) return { ok: false, raison: texte(genData.reason) ?? "quota", message: texte(genData.error) ?? "Limite de simulations atteinte pour aujourd'hui." };
  if (gen.status === 401) return { ok: false, raison: texte(genData.reason) ?? "expired", message: "La demande a expiré avant d'atteindre le service. Votre photo et vos choix sont conservés : réessayez." };
  if (gen.status === 409) {
    // Une zone choisie n'est pas visible sur la photo : le CRM le dit avant de dépenser, le message est affiché tel quel.
    const zones = Array.isArray(genData.zones) ? (genData.zones as unknown[]).filter((z): z is string => typeof z === "string") : [];
    return { ok: false, raison: "zone-non-visible", message: texte(genData.error) ?? "Une zone choisie n'est pas visible sur votre photo : retirez-la, ou reprenez une photo où elle apparaît.", zones };
  }
  return { ok: false, raison: texte(genData.reason) ?? `crm-${gen.status}`, message: texte(genData.error) ?? MESSAGE_INJOIGNABLE };
}

/** Ce que le sondage rend, avec les data URL du rendu quand il est PRETE (servies ensuite par adresse). */
export type ReponseSuiviComplete = ReponseSuivi & { image?: string; imageAvant?: string | null };

export async function sonderTravail(travailId: string, parcoursId: string): Promise<EvenementSondage & { reponse?: ReponseSuiviComplete }> {
  try {
    const reponse = await fetch(`${SIMULATE_URL}?id=${encodeURIComponent(travailId)}&p=${encodeURIComponent(parcoursId)}`, { cache: "no-store" });
    if (!reponse.ok) return { type: "http", status: reponse.status };
    const corps = (await reponse.json()) as ReponseSuiviComplete;
    if (!corps || typeof corps.statut !== "string") return { type: "http", status: 502 };
    return { type: "reponse", reponse: corps };
  } catch {
    return { type: "reseau" };
  }
}

export async function demanderAEtrePrevenu(demande: { travailId: string; parcoursId: string; email?: string; telephone?: string }): Promise<{ ok: boolean; message?: string }> {
  try {
    const reponse = await fetch(`${SIMULATE_URL}/prevenir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Le texte de la case cochée part avec la demande : c'est la preuve du consentement que le CRM enregistre.
      body: JSON.stringify({ travailId: demande.travailId, parcoursId: demande.parcoursId, email: demande.email || undefined, telephone: demande.telephone || undefined, consentement: true, consentementTexte: TEXTE_CONSENTEMENT_PREVENIR }),
    });
    const corps = await lireJson(reponse);
    if (reponse.ok) return { ok: true };
    return { ok: false, message: texte(corps.error) ?? "Nous n'avons pas pu enregistrer votre demande. Réessayez." };
  } catch {
    return { ok: false, message: "Connexion interrompue : réessayez dans un instant." };
  }
}

/* ── Analyse de la photo (dès son chargement) ─────────────────────── */

export type ResultatAnalyse = { ok: true; reponse: ReponseAnalyseCrm } | { ok: false; raison: string };

const lireAnalyse = (corps: Record<string, unknown>): ReponseAnalyseCrm | null =>
  typeof corps.empreinte === "string" && typeof corps.statut === "string" ? (corps as unknown as ReponseAnalyseCrm) : null;

export async function demanderAnalyse(demande: { parcoursId: string; projet: string; photo: string }): Promise<ResultatAnalyse> {
  if (!SIMULATE_URL) return { ok: false, raison: "non-configure" };
  try {
    const reponse = await fetch(`${SIMULATE_URL}/analyse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parcoursId: demande.parcoursId, projet: demande.projet, photo_base64: demande.photo }) });
    const corps = await lireJson(reponse);
    const lue = reponse.ok ? lireAnalyse(corps) : null;
    return lue ? { ok: true, reponse: lue } : { ok: false, raison: texte(corps.reason) ?? `http-${reponse.status}` };
  } catch {
    return { ok: false, raison: "reseau" };
  }
}

export async function sonderAnalyse(empreinte: string, parcoursId: string): Promise<ResultatAnalyse> {
  try {
    const reponse = await fetch(`${SIMULATE_URL}/analyse?e=${encodeURIComponent(empreinte)}&p=${encodeURIComponent(parcoursId)}`, { cache: "no-store" });
    const corps = await lireJson(reponse);
    const lue = reponse.ok ? lireAnalyse(corps) : null;
    return lue ? { ok: true, reponse: lue } : { ok: false, raison: texte(corps.reason) ?? `http-${reponse.status}` };
  } catch {
    return { ok: false, raison: "reseau" };
  }
}

/* ── Photo convertie par le CRM (HEIC que le navigateur ne décode pas) ── */

export type Conversion = { ok: true; dataUrl: string; largeur: number; hauteur: number } | { ok: false; raison: string; message: string };

export async function convertirPhotoParLeCrm(file: File, parcoursId: string): Promise<Conversion> {
  if (!SIMULATE_URL) return { ok: false, raison: "non-configure", message: "La conversion de cette photo n'est pas disponible pour l'instant : envoyez une capture d'écran de la photo." };
  const formulaire = new FormData();
  formulaire.set("parcoursId", parcoursId);
  formulaire.set("photo", file, file.name || "photo.heic");
  try {
    const reponse = await fetch(`${SIMULATE_URL}/photo`, { method: "POST", body: formulaire });
    const corps = await lireJson(reponse);
    if (reponse.ok && typeof corps.photo_base64 === "string") {
      return { ok: true, dataUrl: corps.photo_base64, largeur: typeof corps.largeur === "number" ? corps.largeur : 0, hauteur: typeof corps.hauteur === "number" ? corps.hauteur : 0 };
    }
    return { ok: false, raison: texte(corps.reason) ?? `http-${reponse.status}`, message: texte(corps.error) ?? "Nous n'avons pas pu convertir cette photo. Envoyez une capture d'écran de la photo, ou une photo en JPEG." };
  } catch {
    return { ok: false, raison: "reseau", message: "Connexion interrompue pendant l'envoi de la photo : réessayez." };
  }
}
