/**
 * Helper CRM — envoie un lead au webhook CRM CoverSwap.
 *
 * Usage SERVEUR uniquement (route handler / server action).
 * NE JAMAIS importer ce fichier depuis un client component : il expose
 * le secret webhook via process.env et fait un fetch sans CORS.
 *
 * ── STRATÉGIE ANTI-PERTE ──
 * 1. Tentative d'envoi au webhook CRM (timeout court).
 * 2. En cas d'échec (404 / 5xx / timeout / secret invalide) :
 *    a. Tentative d'écriture en queue locale (.crm-queue.json) — best effort,
 *       marche en dev mais pas sur Vercel serverless (FS read-only).
 *    b. Envoi d'un email de secours via Resend au gérant avec tout le payload
 *       → jamais de lead perdu silencieusement, même si la queue échoue.
 * 3. Toujours fire-and-forget côté caller → la réponse HTTP au client
 *    n'est jamais bloquée par un problème CRM.
 */

import { promises as fs } from "fs";
import path from "path";
import { Resend } from "resend";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
export type CrmSource =
  | "SITE_SIMULATEUR"
  | "SITE_CONTACT"
  | "SITE_DEVIS"
  | "ORGANIQUE";

export type CrmTypeProjet =
  | "CUISINE"
  | "SDB"
  | "MEUBLES"
  | "PRO"
  | "AUTRE";

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
  // Images base64 (data URL ou raw) à joindre à la simulation côté CRM
  imageBefore?: string;
  imageAfter?: string;
  imageOriginal?: string;
}

export interface CrmResult {
  ok: boolean;
  leadId?: string;
  error?: string;
  queued?: boolean;
  emailFallback?: boolean;
}

interface QueuedLead {
  payload: Record<string, unknown>;
  timestamp: string;
  attempts: number;
  lastError?: string;
}

/* ══════════════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════════════ */
const DEFAULT_URL = "http://localhost:3001/api/webhook";
const TIMEOUT_MS = 5000;
const TIMEOUT_WITH_IMAGES_MS = 20000; // upload photos = plus lent
const QUEUE_FILE = path.join(process.cwd(), ".crm-queue.json");
const RETRY_INTERVAL_MS = 30_000; // 30 secondes
const MAX_RETRY_ATTEMPTS = 50; // ~25 min de tentatives max
const FALLBACK_EMAIL = process.env.LEAD_FALLBACK_EMAIL || "contact@coverswap.fr";
const EMAIL_FROM = process.env.LEAD_FALLBACK_FROM || "CoverSwap Alert <noreply@coverswap.fr>";

/* ══════════════════════════════════════════════════════════════════
   QUEUE — lecture / écriture fichier JSON (best effort en prod)
══════════════════════════════════════════════════════════════════ */
async function readQueue(): Promise<QueuedLead[]> {
  try {
    const raw = await fs.readFile(QUEUE_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedLead[]): Promise<boolean> {
  try {
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[CRM Queue] Erreur écriture (FS read-only ? Vercel serverless):", err);
    return false;
  }
}

async function addToQueue(
  cleaned: Record<string, unknown>,
  error: string
): Promise<boolean> {
  const queue = await readQueue();
  queue.push({
    payload: cleaned,
    timestamp: new Date().toISOString(),
    attempts: 1,
    lastError: error,
  });
  const ok = await writeQueue(queue);
  if (ok) {
    console.warn(
      `[CRM Queue] Lead sauvé en file d'attente (${queue.length} en attente)`
    );
  }
  return ok;
}

/* ══════════════════════════════════════════════════════════════════
   FALLBACK EMAIL — dernière ligne de défense anti-perte
══════════════════════════════════════════════════════════════════ */
function formatLeadHtml(
  payload: Record<string, unknown>,
  error: string
): string {
  const rows: [string, string | undefined][] = [
    ["Prénom", payload.prenom as string],
    ["Nom", payload.nom as string],
    ["Téléphone", payload.telephone as string],
    ["Email", payload.email as string | undefined],
    ["Ville", payload.ville as string | undefined],
    ["Code postal", payload.codePostal as string | undefined],
    ["Source", payload.source as string | undefined],
    ["Type projet", payload.typeProjet as string | undefined],
    ["Référence", payload.referenceChoisie as string | undefined],
    ["Notes", payload.notes as string | undefined],
  ];
  const tableRows = rows
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px;font-weight:bold;background:#f8f8f8;">${k}</td><td style="padding:4px 12px;">${v}</td></tr>`
    )
    .join("");
  return `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#CC0000;">🚨 Lead non enregistré dans le CRM</h2>
      <p><strong>Erreur technique :</strong> <code>${error}</code></p>
      <p>Le lead n'a pas pu atteindre le CRM. Contacte la personne manuellement et ajoute-la au CRM une fois disponible.</p>
      <table style="border-collapse:collapse;border:1px solid #ddd;">
        ${tableRows}
      </table>
      <p style="margin-top:20px;font-size:12px;color:#888;">
        Email généré automatiquement par le fallback site → CRM.
        Si tu vois cet email, le webhook CRM est en panne.
      </p>
    </div>
  `;
}

async function sendFallbackEmail(
  payload: Record<string, unknown>,
  error: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "[CRM Fallback] RESEND_API_KEY non configuré — impossible d'envoyer l'email de secours"
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const name = `${payload.prenom || "?"} ${payload.nom || "?"}`.trim();
    const { error: sendErr } = await resend.emails.send({
      from: EMAIL_FROM,
      to: FALLBACK_EMAIL,
      subject: `🚨 LEAD NON CAPTURÉ CRM — ${name} (${payload.telephone || "?"})`,
      html: formatLeadHtml(payload, error),
    });
    if (sendErr) {
      console.error("[CRM Fallback] Resend error:", sendErr);
      return false;
    }
    console.log(`[CRM Fallback] Email de secours envoyé à ${FALLBACK_EMAIL}`);
    return true;
  } catch (err) {
    console.error("[CRM Fallback] Exception envoi email:", err);
    return false;
  }
}

/* ══════════════════════════════════════════════════════════════════
   ENVOI — tente d'envoyer un payload au CRM
══════════════════════════════════════════════════════════════════ */
async function sendPayload(
  cleaned: Record<string, unknown>
): Promise<CrmResult> {
  const url = process.env.CRM_WEBHOOK_URL || DEFAULT_URL;
  const secret = process.env.CRM_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[CRM] CRM_WEBHOOK_SECRET non configuré — lead ignoré");
    return { ok: false, error: "missing-secret" };
  }

  const hasImages = !!(cleaned.imageBefore || cleaned.imageAfter);
  const timeout = hasImages ? TIMEOUT_WITH_IMAGES_MS : TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret,
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
      return { ok: false, error: `http-${res.status}: ${details ?? ""}` };
    }

    try {
      const body = await res.json();
      const leadId: string | undefined = body?.id || body?.leadId;
      return { ok: true, leadId };
    } catch {
      return { ok: true };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === "AbortError";
    const msg = isAbort
      ? `timeout-${timeout}ms`
      : (err as Error)?.message || "unknown";
    return { ok: false, error: msg };
  }
}

/* ══════════════════════════════════════════════════════════════════
   RETRY — vide la queue automatiquement
══════════════════════════════════════════════════════════════════ */
let retryRunning = false;
let retryTimer: ReturnType<typeof setInterval> | null = null;

async function processQueue(): Promise<void> {
  if (retryRunning) return;
  retryRunning = true;

  try {
    const queue = await readQueue();
    if (queue.length === 0) {
      retryRunning = false;
      // Arrête le timer si la queue est vide
      if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
      }
      return;
    }

    console.log(`[CRM Queue] Retry: ${queue.length} lead(s) en attente...`);

    const remaining: QueuedLead[] = [];

    for (const item of queue) {
      const result = await sendPayload(item.payload);

      if (result.ok) {
        console.log(
          `[CRM Queue] ✓ Lead renvoyé avec succès${
            result.leadId ? ` (id=${result.leadId})` : ""
          } — était en attente depuis ${item.timestamp}`
        );
      } else if (item.attempts >= MAX_RETRY_ATTEMPTS) {
        console.error(
          `[CRM Queue] ✗ Lead abandonné après ${item.attempts} tentatives — envoi email secours`
        );
        // Dernier recours : email au gérant
        await sendFallbackEmail(item.payload, result.error || "retries-exhausted");
        await archiveFailedLead(item);
      } else {
        remaining.push({
          ...item,
          attempts: item.attempts + 1,
          lastError: result.error,
        });
      }
    }

    await writeQueue(remaining);

    if (remaining.length === 0 && retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
      console.log("[CRM Queue] ✓ File d'attente vidée — retry stoppé");
    }
  } catch (err) {
    console.error("[CRM Queue] Erreur retry:", err);
  } finally {
    retryRunning = false;
  }
}

async function archiveFailedLead(item: QueuedLead): Promise<void> {
  const archivePath = path.join(process.cwd(), ".crm-failed-leads.json");
  try {
    let archive: QueuedLead[] = [];
    try {
      const raw = await fs.readFile(archivePath, "utf-8");
      archive = JSON.parse(raw);
    } catch {
      /* fichier n'existe pas encore */
    }
    archive.push(item);
    await fs.writeFile(archivePath, JSON.stringify(archive, null, 2), "utf-8");
    console.warn(
      `[CRM Queue] Lead archivé dans .crm-failed-leads.json pour traitement manuel`
    );
  } catch (err) {
    console.error("[CRM Queue] Erreur archivage:", err);
  }
}

function startRetryLoop(): void {
  if (retryTimer) return;
  retryTimer = setInterval(processQueue, RETRY_INTERVAL_MS);
  // Premier essai immédiat après 5s (laisse le serveur démarrer)
  setTimeout(processQueue, 5000);
}

/* ══════════════════════════════════════════════════════════════════
   API PUBLIQUE — sendLeadToCRM
══════════════════════════════════════════════════════════════════ */

/**
 * Envoie un lead au CRM — fire-and-forget côté serveur.
 * Si le CRM est down : tentative queue locale (best effort), puis email
 * de secours au gérant via Resend. Ne throw jamais.
 */
export async function sendLeadToCRM(
  payload: CrmLeadPayload
): Promise<CrmResult> {
  // Nettoie les champs optionnels vides / undefined avant envoi
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null || v === "") continue;
    cleaned[k] = v;
  }

  // Validation minimale
  if (!cleaned.prenom || !cleaned.nom || !cleaned.telephone) {
    console.error("[CRM] Payload incomplet (prenom/nom/telephone requis)", {
      has: Object.keys(cleaned),
    });
    return { ok: false, error: "incomplete-payload" };
  }

  const result = await sendPayload(cleaned);

  if (result.ok) {
    console.log(
      `[CRM] Lead créé${result.leadId ? ` (id=${result.leadId})` : ""}`
    );
    return result;
  }

  // Échec webhook → 2 filets de sécurité en cascade :
  //   1) queue locale (marche en dev, probablement pas sur Vercel)
  //   2) email immédiat via Resend (marche toujours)
  const lean = { ...cleaned };
  delete lean.imageBefore;
  delete lean.imageAfter;
  delete lean.imageOriginal;
  console.error(
    `[CRM] Envoi échoué (${result.error}) — queue + email secours`
  );

  const queued = await addToQueue(lean, result.error || "unknown");
  if (queued) startRetryLoop();

  // Envoi immédiat de l'email de secours (ne pas attendre les retries)
  const emailFallback = await sendFallbackEmail(lean, result.error || "unknown");

  return {
    ok: false,
    error: result.error,
    queued,
    emailFallback,
  };
}

/* ══════════════════════════════════════════════════════════════════
   AUTO-START — vide la queue au démarrage du serveur
   (si des leads étaient en attente d'une session précédente)
══════════════════════════════════════════════════════════════════ */
readQueue().then((queue) => {
  if (queue.length > 0) {
    console.log(
      `[CRM Queue] ${queue.length} lead(s) en attente du dernier démarrage — lancement retry`
    );
    startRetryLoop();
  }
});

/* ══════════════════════════════════════════════════════════════════
   HELPERS — splitName + mapTypeProjet
══════════════════════════════════════════════════════════════════ */
export function splitName(fullName: string): { prenom: string; nom: string } {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "Inconnu", nom: "Inconnu" };
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return {
    prenom: parts[0],
    nom: parts.slice(1).join(" "),
  };
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
