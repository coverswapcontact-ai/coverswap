"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Widget Cloudflare Turnstile (captcha invisible ou quasi). Ne s'affiche que si
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY est définie ; sinon le formulaire reste
 * utilisable (pot de miel + limite côté CRM). `onToken` reçoit le jeton à
 * joindre à l'envoi ; il change à chaque nouvelle vérification.
 */
export default function Turnstile({ onToken, action }: { onToken: (jeton: string | null) => void; action: string }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const id = useId();
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let annule = false;
    const rendre = () => {
      if (annule || !conteneur.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(conteneur.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        theme: "dark",
        language: "fr",
        callback: (jeton: string) => onTokenRef.current(jeton),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
      });
    };
    if (window.turnstile) rendre();
    else window.addEventListener("turnstile-pret", rendre, { once: true });
    return () => {
      annule = true;
      window.removeEventListener("turnstile-pret", rendre);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [action]);

  if (!TURNSTILE_SITE_KEY) return null;

  return (
    <>
      <Script
        id="turnstile-api"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => window.dispatchEvent(new Event("turnstile-pret"))}
      />
      <div ref={conteneur} id={`turnstile-${id}`} className="min-h-[65px]" />
    </>
  );
}

/** Après un envoi, redemande un jeton neuf (un jeton Turnstile ne sert qu'une fois). */
export function reinitialiserTurnstile() {
  try {
    window.turnstile?.reset();
  } catch {
    /* widget absent */
  }
}
