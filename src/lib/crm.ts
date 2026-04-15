/**
 * Helper CRM — envoie un lead au webhook CRM CoverSwap.
 *
 * Usage SERVEUR uniquement (route handler / server action).
 * NE JAMAIS importer ce fichier depuis un client component : il expose
 * le secret webhook via process.env et fait un fetch sans CORS.
 *
 * ── QUEUE DE SECOURS ──
 * Si le CRM est injoignable, le lead est sauvé dans un fichier JSON
 * local (.crm-queue.json). Un job de retry tourne toutes les 30 s et
 * renvoie automatiquement les leads en attente dès que le CRM revient.
 * → 0 lead perdu, même si le CRM est éteint.
 */

import { promises as fs } from "fs";
import path from "path";

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
}

export interface CrmResult {
  ok: boolean;
  leadId?: string;
  error?: string;
  queued?: boolean;
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
const QUEUE_FILE = path.join(process.cwd(), ".crm-queue.json");
const RETRY_INTERVAL_MS = 30_000; // 30 secondes
const MAX_RETRY_ATTEMPTS = 50; // ~25 min de tentatives max

/* ══════════════════════════════════════════════════════════════════
   QUEUE — lecture / écriture fichier JSON
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

async function writeQueue(queue: QueuedLead[]): Promise<void> {
  try {
    await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
  } catch (err) {
    console.error("[CRM Queue] Erreur écriture:", err);
  }
}

async function addToQueue(
  cleaned: Record<string, unknown>,
  error: string
): Promise<void> {
  const queue = await readQueue();
  queue.push({
    payload: cleaned,
    timestamp: new Date().toISOString(),
    attempts: 1,
    lastError: error,
  });
  await writeQueue(queue);
  console.warn(
    `[CRM Queue] Lead sauvé en file d'attente (${queue.length} en attente)`
  );
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
      ? `timeout-${TIMEOUT_MS}ms`
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
          `[CRM Queue] ✗ Lead abandonné après ${item.attempts} tentatives:`,
          item.payload
        );
        // On le garde quand même dans un fichier d'archive
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
 * Si le CRM est down, le lead est sauvé en queue locale et
 * retransmis automatiquement dès que le CRM revient.
 * Ne throw jamais.
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

  // Échec → sauvegarde en queue + lancement du retry
  console.error(`[CRM] Envoi échoué (${result.error}) — mise en queue`);
  await addToQueue(cleaned, result.error || "unknown");
  startRetryLoop();

  return { ok: false, error: result.error, queued: true };
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
