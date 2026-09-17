import { NextRequest, NextResponse } from "next/server";
import { MESSAGE_ECHEC_TOTAL, sendLeadToCRM, splitName, type CrmTypeProjet } from "@/lib/crm";
import { MESSAGE_CAPTCHA, verifierTurnstile } from "@/lib/turnstile";
import { parcoursIdValide } from "@/lib/parcours";
import { getProject } from "@/lib/simulateur/projets";

/**
 * POST /api/simulation/contact — après le résultat du simulateur, la personne
 * laisse ses coordonnées : le lead est créé dans le CRM, ses simulations du
 * parcours (gardées côté CRM) lui sont rattachées, et les rendus faits par le
 * chemin de secours (sans identifiant) partent avec la demande.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function texte(v: unknown, max: number): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ success: true });

  const nom = texte(body.name, 120);
  const telephone = texte(body.phone, 30);
  const email = texte(body.email, 200);
  if (!nom || !telephone || !email) return NextResponse.json({ error: "Nom, téléphone et e-mail sont nécessaires pour vous envoyer le devis." }, { status: 400 });
  if (telephone.replace(/\D/g, "").length < 9) return NextResponse.json({ error: "Numéro de téléphone incomplet." }, { status: 400 });

  const captcha = await verifierTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return NextResponse.json({ error: MESSAGE_CAPTCHA, reason: "captcha" }, { status: 400 });

  const { prenom, nom: nomFamille } = splitName(nom);
  const projet = getProject(texte(body.project_type, 40) ?? "cuisine");
  const simulationIds = Array.isArray(body.simulationIds) ? (body.simulationIds as unknown[]).filter((s): s is string => typeof s === "string" && /^[a-z0-9]{10,40}$/i.test(s)).slice(0, 10) : [];
  const rendus = Array.isArray(body.rendusLocaux)
    ? (body.rendusLocaux as { avant?: unknown; apres?: unknown; references?: unknown }[]).filter((r) => typeof r.avant === "string" && typeof r.apres === "string").slice(0, 3)
    : [];
  const references = texte(body.references, 500);

  const resultat = await sendLeadToCRM(
    {
      prenom,
      nom: nomFamille,
      telephone,
      email,
      ville: texte(body.ville, 120),
      codePostal: texte(body.codePostal, 12),
      source: "SITE_SIMULATEUR",
      typeProjet: projet.crmTypeProjet as CrmTypeProjet,
      referenceChoisie: texte(body.referenceChoisie, 80),
      message: texte(body.message, 4000),
      parcoursId: parcoursIdValide(body.parcoursId),
      simulationIds,
      notes: references ? `Simulation ${projet.id} : ${references}` : `Simulation ${projet.id}`,
      // Chemin de secours (pas d'identifiant côté CRM) : le dernier rendu part avec la demande.
      imageBefore: typeof rendus[0]?.avant === "string" ? (rendus[0].avant as string) : undefined,
      imageAfter: typeof rendus[0]?.apres === "string" ? (rendus[0].apres as string) : undefined,
      campagne: texte(body.campagne, 120),
      publicite: texte(body.publicite, 120),
      formulaire: texte(body.formulaire, 200),
      ...(typeof body.consentementMail === "boolean" ? { consentementMail: body.consentementMail, consentementTexte: texte(body.consentementTexte, 1000) } : {}),
    },
    { ipVisiteur: ip }
  );

  if (resultat.ok) return NextResponse.json({ success: true, leadId: resultat.leadId ?? null, simulations: resultat.simulations ?? 0, consentement: resultat.consentement ?? null });
  if (resultat.emailFallback) return NextResponse.json({ success: true, leadId: null, viaMail: true });
  return NextResponse.json({ error: MESSAGE_ECHEC_TOTAL, reason: resultat.error }, { status: 502 });
}
