import { NextResponse } from "next/server";

/**
 * GET /api/health — sonde de déploiement : quel commit tourne, et quels
 * branchements sont configurés (présence des variables, jamais leur valeur).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      at: new Date().toISOString(),
      crm: !!(process.env.CRM_WEBHOOK_URL && process.env.CRM_WEBHOOK_SECRET),
      secoursMail: !!process.env.RESEND_API_KEY,
      simulateurRailway: !!process.env.SIMULATE_TOKEN_SECRET,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
