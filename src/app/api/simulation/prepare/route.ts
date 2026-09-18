import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkSimulationRateLimit } from "@/lib/rate-limit";
import { getProject, type ProjectType } from "@/lib/simulateur/projets";
import { buildImagePrompt } from "@/lib/simulation-prompt";
import { lireSelections } from "@/lib/simulateur/selections";
import { MESSAGE_CAPTCHA, verifierTurnstile } from "@/lib/turnstile";
import { parcoursIdValide } from "@/lib/parcours";

/**
 * /api/simulation/prepare — première moitié d'une simulation (rapide, sans
 * appel OpenAI) : limite indicative, captcha si configuré, prompt construit
 * depuis la source unique (lib/simulation-prompt), puis signature HMAC de
 * { prompt, swatchUrls, exp, parcours } avec SIMULATE_TOKEN_SECRET.
 *
 * Le navigateur transmet ensuite le tout au CRM (/api/simulate, sans limite de
 * temps), qui vérifie la signature, génère l'image et garde la simulation avec
 * le parcours. Aucune coordonnée à cette étape : elles viennent après le
 * résultat (/api/simulation/contact).
 *
 * Sans SIMULATE_TOKEN_SECRET → 503 : le navigateur bascule sur /api/simulation.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const TOKEN_TTL_MS = 90_000; // le navigateur a 90 s pour transmettre au CRM

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const secret = process.env.SIMULATE_TOKEN_SECRET;
  if (!secret) return NextResponse.json({ error: "not-configured", reason: "no-secret" }, { status: 503 });

  const ip = getClientIp(req);
  const rl = checkSimulationRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error:
          rl.reason === "global-quota"
            ? "Le quota quotidien de simulations gratuites est atteint. Réessayez demain ou demandez un devis : nous ferons la simulation pour vous."
            : `Vous avez atteint la limite de ${rl.limit} simulations gratuites par jour. Demandez un devis : nous ferons la simulation pour vous.`,
        reason: rl.reason,
        resetAt: rl.resetAt,
      },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ error: "ok" }, { status: 400 });

  const parcoursId = parcoursIdValide(body.parcoursId);
  if (!parcoursId) return NextResponse.json({ error: "Identifiant de parcours manquant : rechargez la page.", reason: "parcours" }, { status: 400 });

  const captcha = await verifierTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) {
    console.warn(`[/api/simulation/prepare] captcha refusé (${captcha.raison}) ip=${ip}`);
    return NextResponse.json({ error: MESSAGE_CAPTCHA, reason: "captcha" }, { status: 400 });
  }

  // Surfaces choisies : la référence est relue dans le catalogue du site, rien du navigateur n'entre dans la consigne
  const project: ProjectType = getProject(typeof body.project_type === "string" ? body.project_type : "cuisine");
  const lecture = lireSelections(body, project);
  if (!lecture.ok) return NextResponse.json({ error: lecture.erreur, reason: lecture.raison }, { status: 400 });
  const { choix, swatchUrls } = lecture;
  const prompt = buildImagePrompt({ project, choix });

  // Signature : prompt, échantillons, expiration et parcours — le CRM la vérifie
  // avant de générer et rattache la simulation à ce parcours, pas à un autre.
  const exp = Date.now() + TOKEN_TTL_MS;
  const sig = crypto.createHmac("sha256", secret).update(`${prompt}\n${swatchUrls.join(",")}\n${exp}\np:${parcoursId}`).digest("hex");

  return NextResponse.json({ ok: true, prompt, swatchUrls, sig, exp, parcoursId, rateLimit: { limit: rl.limit, remaining: rl.remaining, resetAt: rl.resetAt } });
}
