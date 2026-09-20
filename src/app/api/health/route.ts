import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/health — sonde de déploiement : quel commit tourne, et quels
 * branchements sont configurés (présence des variables, jamais leur valeur).
 */
export const dynamic = "force-dynamic";

/** ?ntfy=1 : ntfy.sh répond-il depuis ici ? Le site sert de passerelle aux notifications du CRM (/api/relais/ntfy). */
async function sonderNtfy(): Promise<string> {
  const debut = Date.now();
  try {
    const reponse = await fetch("https://ntfy.sh/v1/health", { signal: AbortSignal.timeout(8000), cache: "no-store" });
    return `HTTP ${reponse.status} en ${Date.now() - debut} ms`;
  } catch (erreur) {
    return `ÉCHEC en ${Date.now() - debut} ms : ${erreur instanceof Error ? `${erreur.name} ${erreur.message}` : "inconnue"}`;
  }
}

export async function GET(requete: NextRequest) {
  const ntfy = new URL(requete.url).searchParams.get("ntfy") === "1" ? await sonderNtfy() : undefined;
  return NextResponse.json(
    {
      ok: true,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      at: new Date().toISOString(),
      crm: !!(process.env.CRM_WEBHOOK_URL && process.env.CRM_WEBHOOK_SECRET),
      secoursMail: !!process.env.RESEND_API_KEY,
      simulateurRailway: !!process.env.SIMULATE_TOKEN_SECRET,
      captcha: !!process.env.TURNSTILE_SECRET_KEY,
      relaisNtfy: !!(process.env.SIMULATE_TOKEN_SECRET || process.env.CRM_WEBHOOK_SECRET),
      ...(ntfy ? { ntfy } : {}),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
