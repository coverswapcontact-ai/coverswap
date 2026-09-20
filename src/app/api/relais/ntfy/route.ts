import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/relais/ntfy — passerelle des notifications du CRM vers ntfy.sh.
 *
 * Pourquoi : ntfy.sh ne répond pas aux connexions venant de l'hébergeur du CRM
 * (Railway) — son adresse de sortie, partagée entre clients, y est filtrée. Le
 * CRM confie donc l'envoi au site, qui sort par une autre adresse. Constaté le
 * 21/09/2026 : TCP sans réponse depuis Railway, immédiat depuis ici.
 *
 * Ce n'est PAS un relais ouvert :
 *  - la destination est figée (ntfy.sh), seul le sujet vient de l'appelant ;
 *  - chaque appel est signé (HMAC-SHA256 du corps horodaté) avec un secret déjà
 *    partagé entre le site et le CRM ; une signature de plus de cinq minutes est
 *    refusée ;
 *  - rien n'est journalisé du contenu : un nom et un téléphone y transitent.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const DESTINATION = "https://ntfy.sh";
const FENETRE_MS = 5 * 60_000;

function secretsPartages(): string[] {
  return [process.env.SIMULATE_TOKEN_SECRET, process.env.CRM_WEBHOOK_SECRET].map((s) => s?.trim() ?? "").filter(Boolean);
}

function signatureValide(horodatage: string, corps: string, recues: string[]): boolean {
  let valide = false;
  for (const secret of secretsPartages()) {
    const attendue = Buffer.from(createHmac("sha256", secret).update(`${horodatage}.${corps}`, "utf8").digest("hex"), "utf8");
    for (const recue of recues) {
      const candidate = Buffer.from(recue, "utf8");
      if (candidate.length === attendue.length && timingSafeEqual(candidate, attendue)) valide = true;
    }
  }
  return valide;
}

type Demande = { sujet?: unknown; titre?: unknown; priorite?: unknown; tags?: unknown; actions?: unknown; texte?: unknown; jeton?: unknown };

const texteCourt = (valeur: unknown, max: number): string => (typeof valeur === "string" ? valeur.slice(0, max) : "");
// Un en-tête HTTP ne porte que de l'ASCII imprimable : le CRM y veille déjà, on revérifie.
const ascii = (valeur: string): string => valeur.replace(/[^\x20-\x7e]/g, "");

export async function POST(requete: NextRequest) {
  if (secretsPartages().length === 0) return NextResponse.json({ erreur: "Relais non configuré." }, { status: 503 });

  const corps = await requete.text();
  const horodatage = requete.headers.get("x-relais-horodatage") ?? "";
  const signatures = (requete.headers.get("x-relais-signature") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const age = Math.abs(Date.now() - Number(horodatage));
  if (!horodatage || !Number.isFinite(age) || age > FENETRE_MS || !signatureValide(horodatage, corps, signatures)) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  }

  let demande: Demande;
  try {
    demande = JSON.parse(corps) as Demande;
  } catch {
    return NextResponse.json({ erreur: "Corps illisible." }, { status: 400 });
  }
  const sujet = texteCourt(demande.sujet, 64);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(sujet)) return NextResponse.json({ erreur: "Sujet invalide." }, { status: 400 });

  const priorite = ascii(texteCourt(demande.priorite, 1));
  const tags = ascii(texteCourt(demande.tags, 80));
  const actions = ascii(texteCourt(demande.actions, 800));
  const jeton = ascii(texteCourt(demande.jeton, 200));
  try {
    const reponse = await fetch(`${DESTINATION}/${sujet}`, {
      method: "POST",
      headers: {
        Title: ascii(texteCourt(demande.titre, 200)),
        ...(priorite ? { Priority: priorite } : {}),
        ...(tags ? { Tags: tags } : {}),
        ...(actions ? { Actions: actions } : {}),
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      },
      body: texteCourt(demande.texte, 3800),
      signal: AbortSignal.timeout(10_000),
    });
    const retour = (await reponse.text()).slice(0, 300);
    return NextResponse.json({ ok: reponse.ok, status: reponse.status, ...(reponse.ok ? {} : { detail: retour }) }, { status: reponse.ok ? 200 : 502 });
  } catch (erreur) {
    const cause = erreur instanceof Error ? `${erreur.name} ${erreur.message}` : "inconnue";
    return NextResponse.json({ ok: false, detail: `ntfy injoignable depuis le relais : ${cause}`.slice(0, 300) }, { status: 502 });
  }
}
