import crypto from "crypto";

/**
 * Jeton de devis 1-clic : après une simulation, le navigateur peut demander un
 * devis sans repasser par le captcha, mais seulement pour SON parcours et SON
 * lead — signés par le serveur, valables deux heures. Sans
 * SIMULATE_TOKEN_SECRET, aucun jeton n'est émis ni exigé.
 */
const TTL_MS = 2 * 60 * 60 * 1000;

function signature(secret: string, parcoursId: string, leadId: string, exp: number): string {
  return crypto.createHmac("sha256", secret).update(`devis\n${parcoursId}\n${leadId}\n${exp}`).digest("hex");
}

export function signerJetonDevis(parcoursId: string, leadId: string): string | undefined {
  const secret = process.env.SIMULATE_TOKEN_SECRET;
  if (!secret || !parcoursId || !leadId) return undefined;
  const exp = Date.now() + TTL_MS;
  return `${exp}.${leadId}.${signature(secret, parcoursId, leadId, exp)}`;
}

/** Renvoie le leadId signé si le jeton est valide pour ce parcours, sinon null. */
export function verifierJetonDevis(jeton: unknown, parcoursId: string | undefined): { ok: boolean; leadId?: string; requis: boolean } {
  const secret = process.env.SIMULATE_TOKEN_SECRET;
  if (!secret) return { ok: true, requis: false };
  if (typeof jeton !== "string" || !parcoursId) return { ok: false, requis: true };
  const [expTexte, leadId, sig] = jeton.split(".");
  const exp = Number(expTexte);
  if (!exp || !leadId || !sig || Date.now() > exp) return { ok: false, requis: true };
  const attendu = signature(secret, parcoursId, leadId, exp);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(attendu, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, requis: true };
  return { ok: true, leadId, requis: true };
}
