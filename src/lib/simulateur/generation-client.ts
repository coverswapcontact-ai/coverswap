import { MESSAGE_INJOIGNABLE, TEXTE_CONSENTEMENT_PREVENIR, type EvenementSondage, type ReferenceRendu, type ReponseSuivi } from "./reprise";

/**
 * Génération côté navigateur (mission 15, partie 1) : `prepare` sur le site
 * (captcha, prompt signé), puis le CRM en ASYNCHRONE — le travail est créé, la
 * réponse revient tout de suite, le rendu se suit par sondage. Plus aucun
 * repli sur Vercel : si le CRM ne répond pas, on le dit honnêtement et la
 * photo reste en mémoire. Les images du rendu sont des adresses du CRM.
 */

export const SIMULATE_URL = process.env.NEXT_PUBLIC_SIMULATE_URL ?? "";

/** Raisons pour lesquelles réessayer tout de suite ne sert à rien : la demande par coordonnées passe devant. */
export const PANNES = ["service-indisponible", "global-quota", "ip-quota", "quota", "captcha", "non-configure"];

export const MESSAGE_NON_CONFIGURE = "Le simulateur n'est pas disponible pour l'instant. Votre photo et vos choix sont conservés : laissez-nous vos coordonnées, nous ferons la simulation pour vous.";

export function baseCrm(): string {
  return SIMULATE_URL.replace(/\/api\/simulate\/?$/, "");
}

export function urlImageTravail(travailId: string, parcoursId: string, quoi: "apres" | "avant"): string {
  return `${SIMULATE_URL}/image?id=${encodeURIComponent(travailId)}&p=${encodeURIComponent(parcoursId)}&quoi=${quoi}`;
}

export type Lancement = { ok: true; travailId: string; attenteEstimeeS: number } | { ok: false; raison: string; message: string };

export type EntreeLancement = {
  projetId: string;
  parcoursId: string;
  turnstileToken: string | null;
  selections: { surface: string; ref: string }[];
  references: ReferenceRendu[];
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
  // 1) Préparation (prompt signé) sur le site — un jeton Turnstile par appel serveur.
  const prep = await fetch("/api/simulation/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_type: entree.projetId, parcoursId: entree.parcoursId, turnstileToken: entree.turnstileToken, selections: entree.selections }),
  }).catch(() => null);
  const prepData = await lireJson(prep);
  if (!prep) return { ok: false, raison: "reseau", message: MESSAGE_INJOIGNABLE };
  if (prep.status === 503) return { ok: false, raison: "non-configure", message: MESSAGE_NON_CONFIGURE };
  if (!prep.ok || !prepData.prompt || !prepData.sig) return { ok: false, raison: texte(prepData.reason) ?? `prepare-${prep.status}`, message: texte(prepData.error) ?? "Simulation refusée pour le moment. Votre photo et vos choix sont conservés." };

  // 2) Le CRM crée le travail et répond tout de suite ; la photo va du navigateur au CRM, jamais par le site.
  const gen = await fetch(SIMULATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asynchrone: true,
      prompt: prepData.prompt,
      swatchUrls: prepData.swatchUrls,
      sig: prepData.sig,
      exp: prepData.exp,
      parcoursId: entree.parcoursId,
      projet: entree.projetId,
      references: entree.references,
      page: entree.page,
      source: entree.source,
      campagne: entree.campagne,
      photo_base64: entree.photo,
    }),
  }).catch(() => null);
  const genData = await lireJson(gen);
  if (!gen || gen.status >= 500) return { ok: false, raison: gen ? `crm-${gen.status}` : "reseau", message: MESSAGE_INJOIGNABLE };
  if (gen.status === 202 && typeof genData.travailId === "string") {
    return { ok: true, travailId: genData.travailId, attenteEstimeeS: typeof genData.attenteEstimeeS === "number" ? genData.attenteEstimeeS : 75 };
  }
  if (gen.status === 429) return { ok: false, raison: texte(genData.reason) ?? "quota", message: texte(genData.error) ?? "Limite de simulations atteinte pour aujourd'hui." };
  if (gen.status === 401) return { ok: false, raison: texte(genData.reason) ?? "expired", message: "La demande a expiré avant d'atteindre le service. Votre photo et vos choix sont conservés : réessayez." };
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
