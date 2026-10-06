import { NextRequest, NextResponse } from "next/server";
import { MESSAGE_ECHEC_TOTAL, sendLeadToCRM, splitName, mapTypeProjet, resolveSource } from "@/lib/crm";
import { MESSAGE_CAPTCHA, verifierTurnstile } from "@/lib/turnstile";
import { parcoursIdValide } from "@/lib/parcours";
import { estCreneauRappel } from "@/lib/rappel";

// L'envoi au CRM est attendu (photos comprises) : au-delà des 10 s par défaut de Vercel.
export const maxDuration = 30;
export const dynamic = "force-dynamic";

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

// Validation téléphone volontairement PERMISSIVE : on préfère capturer un lead
// avec un numéro fixe / étranger / légèrement mal formaté que de le rejeter.
// On exige juste un nombre plausible de chiffres (9 à 15) pour bloquer le junk.
function isPlausiblePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

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

/* La source CRM vient de `resolveSource` (lib/crm) : « coverswap.fr/contact » → SITE_CONTACT, `SITE_PRO` explicite
   pour le formulaire de /pro (mission 16, partie 4). */

/** Un nombre positif raisonnable (surface du formulaire pro), sinon rien. */
function nombrePositif(valeur: unknown): number | undefined {
  const n = typeof valeur === "number" ? valeur : typeof valeur === "string" ? Number(valeur.replace(",", ".")) : Number.NaN;
  return Number.isFinite(n) && n > 0 && n <= 100_000 ? Math.round(n * 10) / 10 : undefined;
}


/** Consentement mail transmis par le formulaire : booléen + texte figé horodaté. */
function consentementDepuis(body: Record<string, unknown>): { consentementMail?: boolean; consentementTexte?: string } {
  if (typeof body.consentementMail !== "boolean") return {};
  return {
    consentementMail: body.consentementMail,
    consentementTexte: typeof body.consentementTexte === "string" ? body.consentementTexte.slice(0, 1000) : undefined,
  };
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

  if (!isPlausiblePhone(phone)) {
    return NextResponse.json(
      { error: "Numéro de téléphone invalide. Vérifiez votre saisie (au moins 9 chiffres)." },
      { status: 400 }
    );
  }

  // Captcha (Cloudflare Turnstile) — neutre tant que la clé n'est pas configurée.
  const captcha = await verifierTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) {
    console.warn(`[/api/contact] captcha refusé (${captcha.raison}) ip=${ip}`);
    return NextResponse.json({ error: MESSAGE_CAPTCHA, reason: "captcha" }, { status: 400 });
  }

  /* ── Normalisation payload CRM ── */
  const { prenom, nom } = splitName(name);
  const source = resolveSource(typeof body.source === "string" ? body.source : undefined);
  const typeProjet = source === "SITE_PRO" ? "PRO" : mapTypeProjet(typeof body.type_projet === "string" ? body.type_projet : undefined);

  /* ── Photos du projet (data URL, réduites côté client) : jusqu'à 4, en champ dédié ── */
  const photos = Array.isArray(body.photos)
    ? (body.photos as unknown[]).filter((p): p is string => typeof p === "string" && p.startsWith("data:image")).slice(0, 4)
    : [];

  const texte = (valeur: unknown, max: number) => (typeof valeur === "string" && valeur.trim() ? valeur.trim().slice(0, max) : undefined);
  // Formulaire de /pro : société et type de lieu en note, surface en m² ou en mètres linéaires (le CRM la range).
  const surface = source === "SITE_PRO" ? nombrePositif(body.surface) : undefined;
  const notes = [body.reference ? `Réf catalogue : ${body.reference}` : null, texte(body.societe, 120) ? `Société : ${texte(body.societe, 120)}` : null, texte(body.typeLieu, 40) ? `Lieu : ${texte(body.typeLieu, 40)}` : null].filter(Boolean).join(" · ") || undefined;

  /* ── Envoi au CRM, ATTENDU : sur Vercel, répondre avant la fin du fetch le tue ── */
  const resultat = await sendLeadToCRM(
    {
      prenom,
      nom,
      telephone: phone,
      email: texte(body.email, 200),
      ville: texte(body.ville, 120),
      codePostal: texte(body.codePostal, 12),
      source,
      typeProjet,
      referenceChoisie: texte(body.reference, 80),
      message: texte(body.message, 4000),
      styleSouhaite: texte(body.style, 200),
      parcoursId: parcoursIdValide(body.parcoursId),
      photos,
      campagne: texte(body.campagne, 120),
      publicite: texte(body.publicite, 120),
      formulaire: texte(body.formulaire, 200) ?? source,
      canal: texte(body.canal, 60),
      pageEntree: texte(body.pageEntree, 200),
      ...(surface ? (body.surfaceUnite === "ml" ? { surfaceMl: surface } : { surfaceM2: surface }) : {}),
      notes,
      // Site 3.0 (lot B6) : « Être rappelé » de l'accueil — le code du créneau, validé comme dans /api/simulation/contact ; le CRM date le rappel.
      ...(estCreneauRappel(body.rappelCreneau) ? { rappelCreneau: body.rappelCreneau } : {}),
      ...consentementDepuis(body),
    },
    { ipVisiteur: ip }
  );

  if (resultat.ok) {
    return NextResponse.json({ success: true, leadId: resultat.leadId ?? null, photos: resultat.photos ?? 0, consentement: resultat.consentement ?? null });
  }
  // CRM en panne mais contact parti par mail au gérant : la demande est bien prise.
  if (resultat.emailFallback) return NextResponse.json({ success: true, leadId: null, viaMail: true });
  return NextResponse.json({ error: MESSAGE_ECHEC_TOTAL, reason: resultat.error }, { status: 502 });
}
