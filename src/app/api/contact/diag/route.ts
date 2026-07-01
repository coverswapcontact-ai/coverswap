import { NextRequest, NextResponse } from "next/server";
import { sendLeadToCRM } from "@/lib/crm";

/**
 * DIAGNOSTIC TEMPORAIRE — à supprimer après usage.
 * Envoie un lead de test au CRM en AWAITANT le résultat (contrairement à
 * /api/contact qui est fire-and-forget) pour voir la réponse réelle du webhook :
 *   - ok:true            → webhook accepté (secret OK) → pipeline fonctionnel
 *   - error:"http-401"   → secret Vercel ≠ secret Railway (leads perdus)
 *   - error:"timeout..." → webhook injoignable
 * Protégé par un token en query pour éviter tout abus.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("k") !== "cs-diag-9f2x") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stamp = Date.now();
  const result = await sendLeadToCRM({
    prenom: "DIAG",
    nom: `TEST-${stamp}`,
    telephone: "0612345678",
    email: `diag-${stamp}@coverswap-diag.test`,
    source: "SITE_DEVIS",
    typeProjet: "CUISINE",
    notes: "Lead de diagnostic automatique — peut être supprimé du CRM",
  });

  return NextResponse.json({
    diag: "crm-send",
    at: new Date(stamp).toISOString(),
    result,
    hint:
      result.ok
        ? "Webhook accepté : le pipeline fonctionne, le lead manquant venait du numéro invalide."
        : "Webhook refusé : voir result.error (http-401 = secret Vercel≠Railway).",
  });
}
