import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getProject, PROJECT_TYPES } from "@/lib/simulateur/projets";
import { buildImagePrompt } from "@/lib/simulation-prompt";
import { lireSelections } from "@/lib/simulateur/selections";

/**
 * /api/simulation/consigne — la consigne du moteur de simulation, pour le
 * simulateur du CRM (mode API). Même source unique que le simulateur public
 * (lib/simulation-prompt + lib/simulateur/surfaces) : un correctif de prompt
 * vaut pour les deux, rien n'est copié côté CRM.
 *
 * Réservée au CRM : requête signée HMAC-SHA256 avec SIMULATE_TOKEN_SECRET
 * (le secret que les deux applications partagent déjà), horodatée à cinq
 * minutes près. Ni limite de visiteur ni captcha : c'est Lucas, depuis le CRM.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const FENETRE_MS = 5 * 60_000;

export async function POST(req: NextRequest) {
  const secret = process.env.SIMULATE_TOKEN_SECRET;
  if (!secret) return NextResponse.json({ error: "Consigne indisponible : secret non configuré." }, { status: 503 });

  const corps = await req.text();
  const horodatage = req.headers.get("x-coverswap-horodatage") ?? "";
  const signature = req.headers.get("x-coverswap-signature") ?? "";
  const attendue = crypto.createHmac("sha256", secret).update(`${horodatage}\n${corps}`).digest("hex");
  const recue = Buffer.from(signature, "hex");
  const valide = recue.length === Buffer.from(attendue, "hex").length && crypto.timingSafeEqual(recue, Buffer.from(attendue, "hex"));
  if (!valide || !/^\d{13}$/.test(horodatage) || Math.abs(Date.now() - Number(horodatage)) > FENETRE_MS) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(corps);
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }
  const projetDemande = typeof body.project_type === "string" ? body.project_type : "cuisine";
  if (!PROJECT_TYPES.some((p) => p.id === projetDemande)) return NextResponse.json({ error: `Projet inconnu : ${projetDemande.slice(0, 30)}.` }, { status: 400 });
  const project = getProject(projetDemande);
  const lecture = lireSelections(body, project);
  if (!lecture.ok) return NextResponse.json({ error: lecture.erreur, reason: lecture.raison }, { status: 400 });
  const prompt = buildImagePrompt({ project, choix: lecture.choix });
  return NextResponse.json({
    prompt,
    swatchUrls: lecture.swatchUrls,
    choix: lecture.choix.map((c) => ({ surface: c.surface.id, ref: c.revetement.ref, nom: c.revetement.name, indexEchantillon: c.indexEchantillon })),
  });
}
