import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL = "https://coverswap.app.n8n.cloud/webhook/tally-form";

// Rate limiting: IP -> { count, firstRequest }
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Clean up stale entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 15 * 60 * 1000);

// French mobile: 06/07 followed by 8 digits, with optional spaces/dots/dashes
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

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limiting
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

  // Honeypot: if "website" field is filled, silently reject (return 200 to fool bots)
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  // Validate required fields
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Le champ nom est requis." },
      { status: 400 }
    );
  }

  if (!phone) {
    return NextResponse.json(
      { error: "Le champ téléphone est requis." },
      { status: 400 }
    );
  }

  if (!FRENCH_MOBILE_RE.test(phone)) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide. Utilisez un numéro mobile français (06/07)." },
      { status: 400 }
    );
  }

  // Proxy to n8n webhook
  try {
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        name,
        phone,
        source: (body.source as string) || "coverswap.fr",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi. Veuillez réessayer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur de connexion. Veuillez réessayer." },
      { status: 502 }
    );
  }
}
