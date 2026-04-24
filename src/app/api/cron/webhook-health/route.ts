import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Cron Vercel — toutes les 5 min.
 * Ping le webhook CRM avec __health_check=true. Si la réponse n'est pas 200,
 * on envoie un email d'alerte au gérant pour qu'il répare AVANT de perdre
 * des leads client.
 *
 * Déclenché via `vercel.json` crons + Authorization Bearer CRON_SECRET.
 * Vercel Cron envoie automatiquement ce header.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALERT_TO = process.env.LEAD_FALLBACK_EMAIL || "contact@coverswap.fr";
const ALERT_FROM = process.env.LEAD_FALLBACK_FROM || "CoverSwap Alert <noreply@coverswap.fr>";

async function alertOwner(subject: string, detail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[cron webhook-health] RESEND_API_KEY manquant — alerte non envoyée");
    return;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: ALERT_FROM,
      to: ALERT_TO,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;">
          <h2 style="color:#CC0000;">🚨 Webhook CRM en panne</h2>
          <p>Le ping automatique (toutes les 5 min) a échoué.</p>
          <p><strong>Détail :</strong></p>
          <pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;">${detail}</pre>
          <p>⚠️ <strong>Les leads du site ne partent plus dans le CRM.</strong> Vérifie :</p>
          <ul>
            <li>Variables Vercel <code>CRM_WEBHOOK_URL</code> + <code>CRM_WEBHOOK_SECRET</code> (pas de <code>\\n</code> en fin !)</li>
            <li>CRM Railway en ligne sur <a href="https://crm.coverswap.fr/api/health">crm.coverswap.fr/api/health</a></li>
            <li>Logs Vercel/Railway récents</li>
          </ul>
        </div>
      `,
    });
  } catch (err) {
    console.error("[cron webhook-health] Erreur envoi alerte:", err);
  }
}

export async function GET(request: NextRequest) {
  // Vercel Cron envoie Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = process.env.CRM_WEBHOOK_URL;
  const secret = process.env.CRM_WEBHOOK_SECRET;

  if (!url || !secret) {
    await alertOwner(
      "🚨 CRM webhook check — env vars manquantes",
      `CRM_WEBHOOK_URL=${url ? "présent" : "MANQUANT"}\nCRM_WEBHOOK_SECRET=${secret ? "présent" : "MANQUANT"}`
    );
    return NextResponse.json({ ok: false, error: "missing-env-vars" }, { status: 200 });
  }

  // Détection de \n parasites dans les env vars (erreur que tu as déjà eue !)
  if (url !== url.trim() || secret !== secret.trim()) {
    const details = [
      url !== url.trim()
        ? `CRM_WEBHOOK_URL contient des espaces/newlines parasites : ${JSON.stringify(url)}`
        : null,
      secret !== secret.trim()
        ? `CRM_WEBHOOK_SECRET contient des espaces/newlines parasites`
        : null,
    ].filter(Boolean).join("\n");
    await alertOwner("🚨 CRM webhook — env vars avec newlines parasites", details);
    return NextResponse.json({ ok: false, error: "env-var-whitespace" }, { status: 200 });
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": secret,
      },
      body: JSON.stringify({ __health_check: true, ts: new Date().toISOString() }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const elapsed = Date.now() - started;

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      await alertOwner(
        `🚨 CRM webhook KO (HTTP ${res.status})`,
        `URL: ${url}\nStatus: ${res.status}\nElapsed: ${elapsed}ms\nBody: ${body.slice(0, 500)}`
      );
      return NextResponse.json(
        { ok: false, status: res.status, elapsed },
        { status: 200 }
      );
    }

    // Tout va bien
    return NextResponse.json({ ok: true, status: res.status, elapsed });
  } catch (err) {
    const elapsed = Date.now() - started;
    const message = err instanceof Error ? err.message : "unknown";
    await alertOwner(
      `🚨 CRM webhook injoignable (${message})`,
      `URL: ${url}\nError: ${message}\nElapsed: ${elapsed}ms`
    );
    return NextResponse.json({ ok: false, error: message, elapsed }, { status: 200 });
  }
}
