import { NextRequest, NextResponse } from "next/server";
import { sendLeadToCRM, splitName } from "@/lib/crm";

/**
 * POST /api/devis-direct
 * Déclenche une demande de devis en 1 clic, juste après une simulation réussie.
 * L'utilisateur a déjà fourni nom/téléphone/email au step 3, pas besoin de
 * reformulaire. Le CRM dédoublonne par téléphone/email et attache l'info
 * comme nouvelle interaction.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  // Honeypot
  if (body.website) return NextResponse.json({ ok: true });

  if (!body.name || !body.phone || !body.email) {
    return NextResponse.json(
      { error: "Nom, téléphone et email requis." },
      { status: 400 }
    );
  }

  const { prenom, nom } = splitName(body.name);

  const refs = [
    body.credence_ref ? `Crédence ${body.credence_ref} (${body.credence_name || ""})` : null,
    body.plan_ref ? `Plan ${body.plan_ref} (${body.plan_name || ""})` : null,
    body.facade_ref ? `Façade ${body.facade_ref} (${body.facade_name || ""})` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const referenceChoisie =
    body.credence_ref || body.plan_ref || body.facade_ref || undefined;

  const mlEstimes = body.ml ? Number(body.ml) : undefined;
  const prixDevis = body.prix_devis ? Number(body.prix_devis) : undefined;

  const notesParts = [
    "Devis demandé en 1-clic après simulation",
    refs,
    mlEstimes ? `${mlEstimes}ml` : null,
    prixDevis ? `${prixDevis}€` : null,
  ].filter(Boolean);

  const result = await sendLeadToCRM({
    prenom,
    nom,
    telephone: body.phone,
    email: body.email,
    source: "SITE_DEVIS",
    typeProjet: "CUISINE",
    referenceChoisie,
    mlEstimes: Number.isFinite(mlEstimes) ? mlEstimes : undefined,
    prixDevis: Number.isFinite(prixDevis) ? prixDevis : undefined,
    lienSimulation: body.lien_simulation || undefined,
    notes: notesParts.join(" — "),
  });

  return NextResponse.json({ ok: result.ok, queued: result.queued ?? false });
}
