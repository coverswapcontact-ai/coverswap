import { NextRequest, NextResponse } from "next/server";
import { depasseLaLimite } from "@/lib/limite-abus";
import { parcoursIdValide } from "@/lib/parcours";
import { validerSelections } from "@/lib/simulateur/selections";
import { VALIDITE_SIGNATURE_MS, signerSelections } from "@/lib/simulateur/signature";
import { chargerZonesSimulateur } from "@/lib/simulateur/zones";
import { MESSAGE_CAPTCHA, verifierTurnstile } from "@/lib/turnstile";

/**
 * /api/simulation/prepare — la première moitié d'une simulation, sur le site
 * (mission 15, partie 4 : le site est un simple client du CRM, il ne construit
 * plus de prompt) : pot de miel, limite d'abus, captcha si configuré,
 * validation des sélections contre la liste de zones servie par le CRM et le
 * catalogue, puis signature HMAC de { parcoursId, projet, selections, exp }
 * avec SIMULATE_TOKEN_SECRET (partagé avec le CRM).
 *
 * Le navigateur transmet ensuite au CRM (/api/simulate, avec la photo) qui
 * vérifie la signature, relit zones et références, et crée le travail. Aucune
 * coordonnée ici : elles viennent après le résultat (/api/simulation/contact).
 *
 * Sans SIMULATE_TOKEN_SECRET → 503 : le simulateur le dit et propose de laisser
 * ses coordonnées.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 15;

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const secret = process.env.SIMULATE_TOKEN_SECRET;
  if (!secret) return NextResponse.json({ error: "not-configured", reason: "no-secret" }, { status: 503 });

  const ip = getClientIp(req);
  if (depasseLaLimite(`prepare:${ip}`)) {
    return NextResponse.json({ error: "Trop de demandes en peu de temps : réessayez dans quelques minutes.", reason: "ip-quota" }, { status: 429 });
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

  // Sélections validées contre la liste du CRM (zones de la pièce, limite, incompatibilités) et le catalogue.
  const zones = await chargerZonesSimulateur();
  const projet = typeof body.project_type === "string" ? body.project_type : "cuisine";
  const lecture = validerSelections(zones, projet, body.selections);
  if (!lecture.ok) return NextResponse.json({ error: lecture.erreur, reason: lecture.raison }, { status: 400 });

  // Signature : parcours, pièce, sélections et expiration — le CRM la vérifie avant de créer le travail.
  const exp = Date.now() + VALIDITE_SIGNATURE_MS;
  const sig = signerSelections(secret, { parcoursId, projet, selections: lecture.selections, exp });
  return NextResponse.json({ ok: true, projet, selections: lecture.selections, sig, exp, parcoursId });
}
