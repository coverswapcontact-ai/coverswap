import { NextRequest, NextResponse } from "next/server";
import { peekSimulationRateLimit, SIMULATION_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/simulation/quota
 * Renvoie le quota restant pour l'IP appelante, sans rien consommer.
 * Utilisé par le front pour afficher "il vous reste X simulations aujourd'hui".
 */
export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const result = peekSimulationRateLimit(ip);

  return NextResponse.json(
    {
      ok: result.ok,
      limit: SIMULATION_LIMITS.perIp,
      remaining: result.remaining,
      resetAt: result.resetAt,
      reason: result.reason,
    },
    {
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
        "Cache-Control": "no-store",
      },
    }
  );
}
