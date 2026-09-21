import { NextResponse } from "next/server";
import revetements from "@/data/revetements.json";

/**
 * GET /api/catalogue — le catalogue Cover Styl' du site (références, noms,
 * familles, images), en lecture seule. Le CRM le relit ici pour son
 * simulateur : une seule source, réparée chaque semaine par
 * scripts/verifier-catalogue.mjs. Données publiques (déjà affichées sur /revetements).
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return NextResponse.json({ references: revetements, total: revetements.length }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" } });
}
