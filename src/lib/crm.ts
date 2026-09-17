/**
 * Envoi d'un contact du site vers le CRM CoverSwap (webhook Railway).
 *
 * Usage SERVEUR uniquement (route handler). Ne jamais importer depuis un
 * composant client : le secret webhook vient de process.env.
 *
 * ── Règle : jamais d'échec silencieux ──
 * L'envoi est TOUJOURS attendu par la route qui l'appelle (sur Vercel, une
 * fonction qui a répondu est gelée : un fetch lancé « en arrière-plan » ne
 * part jamais). Chaque issue laisse une trace lisible :
 *   - succès : `[CRM] lead enregistré` avec l'identifiant renvoyé par le CRM ;
 *   - échec  : `[CRM] ÉCHEC` avec la cause, puis mail de secours Resend au
 *     gérant avec tout le contact (sans les photos) ; si ce mail échoue aussi,
 *     la route répond une erreur au visiteur au lieu d'un faux « envoyé ».
 */

import { Resend } from "resend";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
export type CrmSource = "SITE_SIMULATEUR" | "SITE_CONTACT" | "SITE_DEVIS" | "ORGANIQUE";

export type CrmTypeProjet = "CUISINE" | "SDB" | "MEUBLES" | "PRO" | "AUTRE";

export interface CrmLeadPayload {
  prenom: string;
  nom: string;
  telephone: string;
  ville?: string;
  email?: string;
  codePostal?: string;
  source: CrmSource;
  typeProjet?: CrmTypeProjet;
  referenceChoisie?: string;
  mlEstimes?: number;
  prixDevis?: number;
  lienSimulation?: string;
  notes?: string;
  // Champs structurés (formulaire du site)
  message?: string;
  styleSouhaite?: string;
  /** Identifiant du parcours navigateur : simulation puis devis = même fiche CRM. */
  parcoursId?: string;
  /** Photos jointes à la demande (data URL), 4 au plus. */
  photos?: string[];
  // Consentement aux e-mails commerciaux : case distincte, texte figé horodaté (lib/consentement)
  consentementMail?: boolean;
  consentementTexte?: string;
  // Images base64 (data URL ou brut) rattachées à la simulation côté CRM
  imageBefore?: string;
  imageAfter?: string;
  imageOriginal?: string;
}

export interface CrmResult {
  ok: boolean;
  /** Identifiant du lead côté CRM (création ou rattachement à un lead existant). */
  leadId?: string;
  /** Vrai si le CRM a rattaché le contact à un lead déjà connu. */
  deduped?: boolean;
  error?: string;
  /** Vrai si, faute de CRM, le contact est parti par mail de secours au gérant. */
  emailFallback?: boolean;
}

/* ══════════════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════════════ */
const TIMEOUT_MS = 6000;
const TIMEOUT_WITH_IMAGES_MS = 20000; // envoi de photos = plus lent
const RETRY_DELAY_MS = 700;
const FALLBACK_EMAIL = process.env.LEAD_FALLBACK_EMAIL || "contact@coverswap.fr";
const EMAIL_FROM = process.env.LEAD_FALLBACK_FROM || "CoverSwap Alert <noreply@coverswap.fr>";

/* ══════════════════════════════════════════════════════════════════
   MAIL DE SECOURS — dernière ligne de défense anti-perte
══════════════════════════════════════════════════════════════════ */
const ENTITES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function echapper(valeur: unknown): string {
  return String(valeur).replace(/[&<>"']/g, (c) => ENTITES[c]);
}

function formatLeadHtml(payload: Record<string, unknown>, error: string): string {
  const rows: [string, unknown][] = [
    ["Prénom", payload.prenom],
    ["Nom", payload.nom],
    ["Téléphone", payload.telephone],
    ["Email", payload.email],
    ["Ville", payload.ville],
    ["Code postal", payload.codePostal],
    ["Source", payload.source],
    ["Type projet", payload.typeProjet],
    ["Référence", payload.referenceChoisie],
    ["Style souhaité", payload.styleSouhaite],
    ["Message", payload.message],
    ["Notes", payload.notes],
  ];
  const tableRows = rows
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:4px 12px;font-weight:bold;background:#f8f8f8;">${k}</td><td style="padding:4px 12px;">${echapper(v)}</td></tr>`)
    .join("");
  return `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#CC0000;">🚨 Contact du site non enregistré dans le CRM</h2>
      <p><strong>Erreur technique :</strong> <code>${echapper(error)}</code></p>
      <p>Le contact n'a pas pu atteindre le CRM. Rappelle la personne et ajoute-la au CRM à la main.</p>
      <table style="border-collapse:collapse;border:1px solid #ddd;">${tableRows}</table>
      <p style="margin-top:20px;font-size:12px;color:#888;">Mail automatique du site coverswap.fr (secours site → CRM). Si tu le reçois, le webhook CRM est en panne.</p>
    </div>
  `;
}

async function sendFallbackEmail(payload: Record<string, unknown>, error: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[CRM] RESEND_API_KEY absente sur Vercel — impossible d'envoyer le mail de secours");
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    const name = `${payload.prenom || "?"} ${payload.nom || "?"}`.trim();
    const { error: sendErr } = await resend.emails.send({
      from: EMAIL_FROM,
      to: FALLBACK_EMAIL,
      subject: `🚨 CONTACT NON ENREGISTRÉ CRM — ${name} (${payload.telephone || "?"})`,
      html: formatLeadHtml(payload, error),
    });
    if (sendErr) {
      console.error("[CRM] mail de secours refusé par Resend :", sendErr);
      return false;
    }
    console.log(`[CRM] mail de secours envoyé à ${FALLBACK_EMAIL}`);
    return true;
  } catch (err) {
    console.error("[CRM] mail de secours : exception", err);
    return false;
  }
}

/* ══════════════════════════════════════════════════════════════════
   ENVOI — une tentative vers le webhook
══════════════════════════════════════════════════════════════════ */
async function sendPayload(cleaned: Record<string, unknown>, ipVisiteur?: string): Promise<CrmResult & { retryable?: boolean }> {
  const url = process.env.CRM_WEBHOOK_URL;
  const secret = process.env.CRM_WEBHOOK_SECRET;

  if (!url || !secret) {
    return { ok: false, error: !url ? "CRM_WEBHOOK_URL absente" : "CRM_WEBHOOK_SECRET absente" };
  }

  const hasImages = !!(cleaned.imageBefore || cleaned.imageAfter || cleaned.imageOriginal || (Array.isArray(cleaned.photos) && cleaned.photos.length));
  const timeout = hasImages ? TIMEOUT_WITH_IMAGES_MS : TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret.trim(),
        // Le CRM limite les demandes par visiteur : il a besoin de l'adresse d'origine, pas de celle de Vercel.
        ...(ipVisiteur && ipVisiteur !== "unknown" ? { "X-Visiteur-Ip": ipVisiteur } : {}),
      },
      body: JSON.stringify(cleaned),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let details: string | undefined;
      try {
        const body = await res.json();
        details = body?.error || body?.details || JSON.stringify(body);
      } catch {
        details = await res.text().catch(() => undefined);
      }
      return { ok: false, error: `http-${res.status}: ${details ?? ""}`.slice(0, 500), retryable: res.status >= 500 };
    }

    try {
      const body = await res.json();
      return { ok: true, leadId: body?.leadId || body?.id, deduped: body?.deduped === true };
    } catch {
      return { ok: true };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return { ok: false, error: isAbort ? `timeout-${timeout}ms` : (err as Error)?.message || "unknown", retryable: true };
  }
}

/* ══════════════════════════════════════════════════════════════════
   API PUBLIQUE — sendLeadToCRM (à AWAITER par la route appelante)
══════════════════════════════════════════════════════════════════ */
export async function sendLeadToCRM(payload: CrmLeadPayload, options: { ipVisiteur?: string } = {}): Promise<CrmResult> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null || v === "") continue;
    cleaned[k] = v;
  }
  // Un consentement se transmet toujours, même « non coché » : le CRM garde la trace datée.
  if (typeof payload.consentementMail === "boolean") cleaned.consentementMail = payload.consentementMail;

  if (!cleaned.prenom || !cleaned.nom || !cleaned.telephone) {
    console.error("[CRM] contact incomplet (prenom/nom/telephone requis)", { champs: Object.keys(cleaned) });
    return { ok: false, error: "incomplete-payload" };
  }

  if (Array.isArray(payload.photos) && payload.photos.length === 0) delete cleaned.photos;

  let result = await sendPayload(cleaned, options.ipVisiteur);
  if (!result.ok && result.retryable) {
    console.warn(`[CRM] premier envoi échoué (${result.error}) — nouvel essai`);
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    result = await sendPayload(cleaned, options.ipVisiteur);
  }

  if (result.ok) {
    console.log(
      `[CRM] lead enregistré id=${result.leadId ?? "?"} source=${cleaned.source} tel=${cleaned.telephone}${result.deduped ? " (rattaché à un lead existant)" : ""}`
    );
    return { ok: true, leadId: result.leadId, deduped: result.deduped };
  }

  const lean = { ...cleaned };
  delete lean.imageBefore;
  delete lean.imageAfter;
  delete lean.imageOriginal;
  delete lean.photos;
  console.error(`[CRM] ÉCHEC (${result.error}) source=${cleaned.source} tel=${cleaned.telephone} — mail de secours`);
  const emailFallback = await sendFallbackEmail(lean, result.error || "unknown");
  if (!emailFallback) console.error("[CRM] ÉCHEC TOTAL : ni CRM ni mail de secours — le visiteur reçoit une erreur");

  return { ok: false, error: result.error, emailFallback };
}

/** Message affiché au visiteur quand rien n'a pu enregistrer sa demande. */
export const MESSAGE_ECHEC_TOTAL =
  "Nous n'avons pas pu enregistrer votre demande. Appelez-nous au 06 70 35 28 69 ou réessayez dans quelques minutes.";

/* ══════════════════════════════════════════════════════════════════
   HELPERS — splitName + mapTypeProjet
══════════════════════════════════════════════════════════════════ */
export function splitName(fullName: string): { prenom: string; nom: string } {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "Inconnu", nom: "Inconnu" };
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

const TYPE_PROJET_MAP: Record<string, CrmTypeProjet> = {
  cuisine: "CUISINE",
  "salle de bain": "SDB",
  "salle-de-bain": "SDB",
  sdb: "SDB",
  meubles: "MEUBLES",
  meuble: "MEUBLES",
  "comptoir / accueil pro": "PRO",
  "bureau / espace de travail": "PRO",
  professionnel: "PRO",
  pro: "PRO",
  autre: "AUTRE",
  vitrages: "AUTRE",
};

export function mapTypeProjet(input?: string): CrmTypeProjet {
  if (!input) return "AUTRE";
  return TYPE_PROJET_MAP[input.toLowerCase().trim()] || "AUTRE";
}
