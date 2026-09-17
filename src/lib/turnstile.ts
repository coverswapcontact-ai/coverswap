/**
 * Cloudflare Turnstile — captcha invisible des formulaires.
 *
 * Côté serveur : `verifierTurnstile` interroge Cloudflare avec
 * TURNSTILE_SECRET_KEY. Tant que la clé n'est pas configurée sur Vercel, la
 * vérification est neutre (le pot de miel et la limite côté CRM restent) et un
 * avertissement est journalisé une fois : le site ne casse jamais faute de clé.
 *
 * Côté client : NEXT_PUBLIC_TURNSTILE_SITE_KEY affiche le widget (components/Turnstile).
 */

let avertissementEmis = false;

export function turnstileConfigure(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifierTurnstile(jeton: unknown, ip: string): Promise<{ ok: boolean; raison?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!avertissementEmis) {
      avertissementEmis = true;
      console.warn("[turnstile] TURNSTILE_SECRET_KEY absente : captcha inactif (pot de miel + limite CRM seulement)");
    }
    return { ok: true };
  }
  if (typeof jeton !== "string" || !jeton) return { ok: false, raison: "jeton-absent" };
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: jeton, remoteip: ip === "unknown" ? undefined : ip }),
      signal: AbortSignal.timeout(6000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true };
    return { ok: false, raison: (data["error-codes"] ?? []).join(",") || "refus" };
  } catch (err) {
    // Cloudflare injoignable : on ne bloque pas un vrai client pour ça.
    console.error("[turnstile] vérification impossible, demande acceptée :", err);
    return { ok: true, raison: "verification-indisponible" };
  }
}

export const MESSAGE_CAPTCHA =
  "La vérification anti-robot a échoué. Rechargez la page et réessayez, ou appelez-nous au 06 70 35 28 69.";
