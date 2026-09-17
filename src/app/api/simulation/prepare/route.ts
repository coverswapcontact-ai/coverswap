import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { MESSAGE_ECHEC_TOTAL, sendLeadToCRM, splitName, type CrmTypeProjet } from "@/lib/crm";
import { MESSAGE_CAPTCHA, verifierTurnstile } from "@/lib/turnstile";
import { parcoursIdValide } from "@/lib/parcours";
import { signerJetonDevis } from "@/lib/jeton-devis";
import { checkSimulationRateLimit } from "@/lib/rate-limit";
import { getProject, type ProjectType } from "@/app/simulation/projects";
import { buildImagePrompt, type ElementInfo } from "@/lib/simulation-prompt";

/**
 * /api/simulation/prepare — chemin Railway (génération sans plafond 60s).
 *
 * Cet endpoint RAPIDE (<5s, aucun appel OpenAI) :
 *   1. applique le rate-limit (même compteur que le chemin sync)
 *   2. crée le lead dans le CRM (contact + références)
 *   3. construit le prompt gpt-image-1 (source unique : lib/simulation-prompt)
 *   4. signe (HMAC) { prompt + swatchUrls + exp } avec SIMULATE_TOKEN_SECRET
 *
 * Le navigateur envoie ensuite { prompt, swatchUrls, sig, exp, photo_base64 }
 * à Railway (/api/simulate) qui VÉRIFIE la signature puis exécute l'appel OpenAI
 * sans contrainte de temps. La signature empêche tout abus (on ne peut pas
 * forger un prompt ni détourner les swatchUrls sans connaître le secret).
 *
 * Si SIMULATE_TOKEN_SECRET n'est pas configuré → 503, le frontend bascule
 * automatiquement sur le chemin synchrone /api/simulation. Rien ne casse.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TOKEN_TTL_MS = 90_000; // le navigateur a 90s pour transmettre à Railway

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    ...(result.retryAfterSec > 0 ? { "Retry-After": String(result.retryAfterSec) } : {}),
  };
}

const CRM_TYPE_MAP: Record<string, CrmTypeProjet> = {
  cuisine: "CUISINE",
  "salle-de-bain": "SDB",
  meubles: "MEUBLES",
  "mur-plafond": "AUTRE",
  professionnel: "PRO",
};


/** Consentement mail transmis par le formulaire : booléen + texte figé horodaté. */
function consentementDepuis(body: Record<string, unknown>): { consentementMail?: boolean; consentementTexte?: string } {
  if (typeof body.consentementMail !== "boolean") return {};
  return {
    consentementMail: body.consentementMail,
    consentementTexte: typeof body.consentementTexte === "string" ? body.consentementTexte.slice(0, 1000) : undefined,
  };
}

/** Crée le lead dans le CRM (attendu) — équivalent au chemin sync, sans image. */
async function pushLeadToCrm(body: Record<string, string>, ip: string) {
  const { prenom, nom } = splitName(body.name);
  const projectType = body.project_type || "cuisine";

  const refs = ["zone1", "zone2", "zone3"]
    .map((z) => {
      const ref = body[`${z}_ref`];
      const label = body[`${z}_label`] || z;
      const name = body[`${z}_name`] || "";
      return ref ? `${label} ${ref} (${name})` : null;
    })
    .filter(Boolean)
    .join(" | ");

  const referenceChoisie = body.zone1_ref || body.zone2_ref || body.zone3_ref || undefined;

  const notesParts = [
    `Simulation IA ${projectType} en ligne`,
    refs,
    body.message ? `Message: ${body.message}` : null,
  ].filter(Boolean);

  return sendLeadToCRM({
    prenom,
    nom,
    telephone: body.phone,
    email: body.email || undefined,
    source: "SITE_SIMULATEUR",
    typeProjet: CRM_TYPE_MAP[projectType] || "AUTRE",
    referenceChoisie,
    lienSimulation: body.lien_simulation || undefined,
    ville: body.ville || undefined,
    codePostal: body.codePostal || undefined,
    parcoursId: parcoursIdValide(body.parcoursId),
    notes: notesParts.join(" — "),
    ...consentementDepuis(body),
  }, { ipVisiteur: ip });
}

export async function POST(req: NextRequest) {
  const secret = process.env.SIMULATE_TOKEN_SECRET;
  if (!secret) {
    // Chemin Railway non configuré → le frontend retombe sur /api/simulation.
    return NextResponse.json({ error: "not-configured", reason: "no-secret" }, { status: 503 });
  }

  const ip = getClientIp(req);
  const rl = checkSimulationRateLimit(ip);
  if (!rl.ok) {
    const resetDate = new Date(rl.resetAt);
    const hoursLeft = Math.ceil((rl.resetAt - Date.now()) / (60 * 60 * 1000));
    const message =
      rl.reason === "global-quota"
        ? "Le quota quotidien de simulations gratuites est atteint pour l'ensemble du site. Réessayez demain ou demandez un devis pour une simulation prioritaire."
        : `Vous avez atteint la limite de ${rl.limit} simulations gratuites par jour. Nouveau crédit dans ${hoursLeft} h (${resetDate.toLocaleString("fr-FR")}).`;
    return NextResponse.json(
      { error: message, reason: rl.reason, resetAt: rl.resetAt },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const body = await req.json();

  // Honeypot anti-bot (champ caché "website")
  if (body.website) {
    return NextResponse.json({ error: "ok" }, { status: 400 });
  }

  // Simulateur v2 : pas de coordonnées avant le résultat. Le parcours est signé
  // dans le jeton ; le CRM garde la simulation et la rattache à la demande de devis.
  const parcoursId = parcoursIdValide(body.parcoursId);
  const sansCoordonnees = !body.name && !body.phone && !body.email;
  if (sansCoordonnees && !parcoursId) {
    return NextResponse.json({ error: "Identifiant de parcours manquant : rechargez la page." }, { status: 400 });
  }
  if (!sansCoordonnees && (!body.name || !body.phone || !body.email)) {
    return NextResponse.json({ error: "Nom, téléphone et email requis." }, { status: 400 });
  }

  const captcha = await verifierTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) {
    console.warn(`[/api/simulation/prepare] captcha refusé (${captcha.raison}) ip=${ip}`);
    return NextResponse.json({ error: MESSAGE_CAPTCHA, reason: "captcha" }, { status: 400 });
  }

  // Crée le lead AVANT la génération, et l'attend : un contact enregistré même
  // si l'image échoue ensuite. Si rien ne peut l'enregistrer, on ne génère pas.
  let leadId = "";
  if (!sansCoordonnees) {
    const lead = await pushLeadToCrm(body, ip);
    if (!lead.ok && !lead.emailFallback) {
      return NextResponse.json({ error: MESSAGE_ECHEC_TOTAL, reason: lead.error }, { status: 502 });
    }
    leadId = lead.leadId ?? "";
  }

  // Parse les zones + ordonne les swatches présents.
  const elements: Record<string, ElementInfo | null> = { zone1: null, zone2: null, zone3: null };
  const swatchUrls: string[] = [];
  const imageIndexMap: Record<string, number | null> = { zone1: null, zone2: null, zone3: null };

  for (const zoneKey of ["zone1", "zone2", "zone3"]) {
    const ref = body[`${zoneKey}_ref`];
    const imageUrl = body[`${zoneKey}_image`];
    if (ref) {
      elements[zoneKey] = {
        ref,
        name: body[`${zoneKey}_name`] || "",
        famille: body[`${zoneKey}_famille`] || "",
        finition: body[`${zoneKey}_finition`],
        categorie: body[`${zoneKey}_categorie`],
        tags: body[`${zoneKey}_tags`],
        imageUrl,
      };
      if (imageUrl) {
        imageIndexMap[zoneKey] = swatchUrls.length;
        swatchUrls.push(imageUrl);
      }
    }
  }

  const projectType = body.project_type || "cuisine";
  const project: ProjectType = getProject(projectType);
  const zoneLabels: Record<string, string> = {
    zone1: body.zone1_label || "Zone 1",
    zone2: body.zone2_label || "Zone 2",
    zone3: body.zone3_label || "Zone 3",
  };

  const prompt = buildImagePrompt({
    project,
    zoneLabels,
    elements,
    imageIndexMap,
    swatchCount: swatchUrls.length,
  });

  // Signature : empêche la falsification du prompt, le détournement des swatchUrls
  // et le rattachement des images à la fiche d'un autre (leadId signé).
  const exp = Date.now() + TOKEN_TTL_MS;
  const cle = leadId ? leadId : parcoursId ? `p:${parcoursId}` : null;
  const payloadToSign = cle ? `${prompt}\n${swatchUrls.join(",")}\n${exp}\n${cle}` : `${prompt}\n${swatchUrls.join(",")}\n${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payloadToSign).digest("hex");

  return NextResponse.json(
    {
      ok: true,
      prompt,
      swatchUrls,
      sig,
      exp,
      leadId: leadId || null,
      parcoursId: parcoursId ?? null,
      jetonDevis: leadId ? (signerJetonDevis(parcoursId ?? "", leadId) ?? null) : null,
      rateLimit: { limit: rl.limit, remaining: rl.remaining, resetAt: rl.resetAt },
    },
    { headers: rateLimitHeaders(rl) }
  );
}
