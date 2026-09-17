import { NextRequest, NextResponse } from "next/server";
import { MESSAGE_ECHEC_TOTAL, sendLeadToCRM, splitName, type CrmTypeProjet } from "@/lib/crm";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

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

/**
 * POST /api/devis-direct
 * Devis 1-clic après simulation — réutilise les infos déjà saisies.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true });

  if (!body.name || !body.phone || !body.email) {
    return NextResponse.json(
      { error: "Nom, téléphone et email requis." },
      { status: 400 }
    );
  }

  const { prenom, nom } = splitName(body.name);
  const projectType = body.project_type || "cuisine";

  // Collecte dynamique des refs zone1/zone2/zone3
  const refs = ["zone1", "zone2", "zone3"]
    .map((z) => {
      const ref = body[`${z}_ref`];
      const name = body[`${z}_name`] || "";
      return ref ? `${ref} (${name})` : null;
    })
    .filter(Boolean)
    .join(" | ");

  const referenceChoisie =
    body.zone1_ref || body.zone2_ref || body.zone3_ref || undefined;

  const notesParts = [
    `Devis demandé en 1-clic après simulation ${projectType}`,
    refs,
  ].filter(Boolean);

  const result = await sendLeadToCRM({
    prenom,
    nom,
    telephone: body.phone,
    email: body.email,
    source: "SITE_DEVIS",
    typeProjet: CRM_TYPE_MAP[projectType] || "AUTRE",
    referenceChoisie,
    notes: notesParts.join(" — "),
    ...consentementDepuis(body),
  });

  if (result.ok) return NextResponse.json({ ok: true, leadId: result.leadId ?? null });
  if (result.emailFallback) return NextResponse.json({ ok: true, leadId: null, viaMail: true });
  return NextResponse.json({ error: MESSAGE_ECHEC_TOTAL, reason: result.error }, { status: 502 });
}
