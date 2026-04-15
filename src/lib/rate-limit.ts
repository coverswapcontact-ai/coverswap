/**
 * Rate limiting journalier pour la simulation IA.
 *
 * 2 niveaux de protection :
 *   1. Quota par IP : N simulations par 24 h
 *   2. Cap global    : M simulations totales sur tout le site par 24 h
 *      (protection budget OpenAI)
 *
 * Stockage en mémoire process — suffisant pour un déploiement Vercel/Node
 * mono-instance. Pour du multi-instance, brancher Upstash Redis plus tard.
 *
 * Les valeurs sont surchargeables via env :
 *   SIMULATION_DAILY_LIMIT_PER_IP   (défaut 3)
 *   SIMULATION_DAILY_LIMIT_GLOBAL   (défaut 50)
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const PER_IP_LIMIT = Number(process.env.SIMULATION_DAILY_LIMIT_PER_IP || 5);
const GLOBAL_LIMIT = Number(process.env.SIMULATION_DAILY_LIMIT_GLOBAL || 80);

interface IpEntry {
  count: number;
  resetAt: number;
}

const ipCounters = new Map<string, IpEntry>();

let globalCount = 0;
let globalResetAt = Date.now() + DAY_MS;

/* ──────────────────────────────────────────────────────────────────
   GC périodique des entrées expirées
────────────────────────────────────────────────────────────────── */
function gc() {
  const now = Date.now();
  for (const [ip, entry] of ipCounters) {
    if (now > entry.resetAt) ipCounters.delete(ip);
  }
}

/* ──────────────────────────────────────────────────────────────────
   API publique
────────────────────────────────────────────────────────────────── */
export interface RateLimitResult {
  ok: boolean;
  /** Raison du refus si ok=false */
  reason?: "ip-quota" | "global-quota";
  /** Quota max applicable */
  limit: number;
  /** Nombre d'essais restants pour cette IP aujourd'hui */
  remaining: number;
  /** Timestamp ms du prochain reset */
  resetAt: number;
  /** Secondes avant reset (pour header Retry-After) */
  retryAfterSec: number;
}

export function checkSimulationRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  // Reset global si fenêtre expirée
  if (now > globalResetAt) {
    globalCount = 0;
    globalResetAt = now + DAY_MS;
    gc();
  }

  // Lookup IP
  let entry = ipCounters.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + DAY_MS };
    ipCounters.set(ip, entry);
  }

  // 1) Quota global atteint ?
  if (globalCount >= GLOBAL_LIMIT) {
    return {
      ok: false,
      reason: "global-quota",
      limit: GLOBAL_LIMIT,
      remaining: 0,
      resetAt: globalResetAt,
      retryAfterSec: Math.max(1, Math.ceil((globalResetAt - now) / 1000)),
    };
  }

  // 2) Quota IP atteint ?
  if (entry.count >= PER_IP_LIMIT) {
    return {
      ok: false,
      reason: "ip-quota",
      limit: PER_IP_LIMIT,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  // OK → on incrémente
  entry.count += 1;
  globalCount += 1;

  return {
    ok: true,
    limit: PER_IP_LIMIT,
    remaining: PER_IP_LIMIT - entry.count,
    resetAt: entry.resetAt,
    retryAfterSec: 0,
  };
}

/**
 * Inspecte sans incrémenter — utile pour /api/simulation/quota
 * (afficher le compteur restant côté client avant la soumission).
 */
export function peekSimulationRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  if (now > globalResetAt) {
    return {
      ok: true,
      limit: PER_IP_LIMIT,
      remaining: PER_IP_LIMIT,
      resetAt: now + DAY_MS,
      retryAfterSec: 0,
    };
  }

  const entry = ipCounters.get(ip);
  const used = entry && now < entry.resetAt ? entry.count : 0;
  const remainingIp = Math.max(0, PER_IP_LIMIT - used);
  const remainingGlobal = Math.max(0, GLOBAL_LIMIT - globalCount);
  const remaining = Math.min(remainingIp, remainingGlobal);

  if (remainingGlobal === 0) {
    return {
      ok: false,
      reason: "global-quota",
      limit: GLOBAL_LIMIT,
      remaining: 0,
      resetAt: globalResetAt,
      retryAfterSec: Math.max(1, Math.ceil((globalResetAt - now) / 1000)),
    };
  }

  if (remainingIp === 0) {
    return {
      ok: false,
      reason: "ip-quota",
      limit: PER_IP_LIMIT,
      remaining: 0,
      resetAt: entry!.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((entry!.resetAt - now) / 1000)),
    };
  }

  return {
    ok: true,
    limit: PER_IP_LIMIT,
    remaining,
    resetAt: entry?.resetAt ?? now + DAY_MS,
    retryAfterSec: 0,
  };
}

export const SIMULATION_LIMITS = {
  perIp: PER_IP_LIMIT,
  global: GLOBAL_LIMIT,
};
