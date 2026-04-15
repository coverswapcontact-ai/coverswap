import { NextRequest, NextResponse } from "next/server";
import { sendLeadToCRM, splitName, mapTypeProjet, type CrmSource } from "@/lib/crm";

/* ──────────────────────────────────────────────────────────────────
   RATE LIMITING
────────────────────────────────────────────────────────────────── */
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 15 * 60 * 1000);

const FRENCH_MOBILE_RE = /^(?:\+33|0033|0)\s*[67](?:[\s.\-]?\d{2}){4}$/;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

/* ──────────────────────────────────────────────────────────────────
   SOURCE ROUTING
   Le client peut passer un champ `source` libre (ex: "coverswap.fr/contact",
   "coverswap.fr/simulation", "site_devis") — on le mappe vers l'enum CRM.
────────────────────────────────────────────────────────────────── */
function resolveSource(raw?: string): CrmSource {
  if (!raw) return "SITE_DEVIS";
  const s = raw.toLowerCase();
  if (s.includes("simulateur") || s.includes("simulation")) return "SITE_SIMULATEUR";
  if (s.includes("devis") || s.includes("/contact")) return "SITE_DEVIS";
  if (s.includes("contact")) return "SITE_CONTACT";
  return "SITE_DEVIS";
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/contact
   Traite à la fois les demandes de devis (/contact) et les
   formulaires de contact simples. Envoie le lead au CRM en
   fire-and-forget — ne bloque jamais la réponse HTTP utilisateur.
══════════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez réessayer dans quelques minutes." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  // Honeypot
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  // Validate
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Le champ nom est requis." }, { status: 400 });
  }

  if (!phone) {
    return NextResponse.json({ error: "Le champ téléphone est requis." }, { status: 400 });
  }

  if (!FRENCH_MOBILE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide. Utilisez un numéro mobile français (06/07)." },
      { status: 400 }
    );
  }

  /* ── Normalisation payload CRM ── */
  const { prenom, nom } = splitName(name);
  const source = resolveSource(typeof body.source === "string" ? body.source : undefined);
  const typeProjet = mapTypeProjet(typeof body.type_projet === "string" ? body.type_projet : undefined);

  const notes = [
    body.message ? `${body.message}` : null,
    body.surface ? `Surface: ${body.surface}` : null,
    body.style ? `Style: ${body.style}` : null,
    body.reference ? `Réf catalogue: ${body.reference}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  /* ── Fire-and-forget CRM — on n'attend pas la réponse pour répondre à l'utilisateur ── */
  sendLeadToCRM({
    prenom,
    nom,
    telephone: phone,
    email: (body.email as string) || undefined,
    ville: (body.ville as string) || undefined,
    codePostal: (body.codePostal as string) || undefined,
    source,
    typeProjet,
    referenceChoisie: (body.reference as string) || undefined,
    notes: notes || undefined,
  }).catch((err) => {
    console.error("[/api/contact] CRM helper threw (ne devrait pas):", err);
  });

  // Réponse immédiate à l'utilisateur, indépendamment du CRM
  return NextResponse.json({ success: true });
}
