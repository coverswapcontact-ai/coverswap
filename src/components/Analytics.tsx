"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Loader unifié pour tous les trackers analytics.
 *
 * Stack 100 % gratuite & illimitée :
 *   - Google Tag Manager (NEXT_PUBLIC_GTM_ID)  — centralise GA4, Ads, etc.
 *   - Google Analytics 4  (NEXT_PUBLIC_GA_ID)  — fallback si pas de GTM
 *   - Meta Pixel          (NEXT_PUBLIC_META_PIXEL_ID)
 *   - Microsoft Clarity   (NEXT_PUBLIC_CLARITY_ID)
 *
 * Comportement RGPD (Consent Mode v2) :
 *   - Les scripts se chargent immédiatement avec consentement REVOKED
 *     (data anonyme agrégée autorisée par CNIL/CMP en 2024).
 *   - Au click "Accepter" les cookies : passage en consentement GRANTED
 *     (tracking personnalisé complet).
 *   - Au refus : les scripts restent en mode REVOKED.
 *   - Si une variable d'env est manquante, le tracker correspondant est ignoré.
 */
export default function Analytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const ok = localStorage.getItem("cookie-consent") === "accepted";
        setConsented(ok);
        if (typeof window === "undefined") return;
        const w = window as unknown as {
          gtag?: (...args: unknown[]) => void;
          fbq?: (...args: unknown[]) => void;
        };
        // Met à jour le Consent Mode Google v2
        if (w.gtag) {
          w.gtag("consent", "update", {
            ad_storage: ok ? "granted" : "denied",
            ad_user_data: ok ? "granted" : "denied",
            ad_personalization: ok ? "granted" : "denied",
            analytics_storage: ok ? "granted" : "denied",
          });
        }
        // Met à jour le Consent Mode Meta Pixel
        if (w.fbq) {
          w.fbq("consent", ok ? "grant" : "revoke");
        }
      } catch {
        setConsented(false);
      }
    };
    check();
    window.addEventListener("cookie-consent-change", check);
    return () => window.removeEventListener("cookie-consent-change", check);
  }, []);

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  // GTM se charge TOUJOURS (avec consent denied par défaut).
  // Les autres trackers (Meta Pixel, Clarity) attendent le consentement.
  return (
    <>
      {/* ── Google Consent Mode v2 — doit être défini AVANT GTM ── */}
      {gtmId && (
        <Script id="gtm-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              ad_storage: '${consented ? "granted" : "denied"}',
              ad_user_data: '${consented ? "granted" : "denied"}',
              ad_personalization: '${consented ? "granted" : "denied"}',
              analytics_storage: '${consented ? "granted" : "denied"}',
              wait_for_update: 500
            });
          `}
        </Script>
      )}

      {/* ── Google Tag Manager — chargé inconditionnellement ── */}
      {gtmId && (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        </>
      )}

      {/* ── Google Analytics 4 (fallback si pas de GTM) ── */}
      {!gtmId && gaId && consented && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
              });
            `}
          </Script>
        </>
      )}

      {/* ── Meta Pixel (Consent Mode) ── */}
      {/* Chargé immédiatement, mais en mode REVOKED tant que pas de consent.
         Au click "Accepter" → consent grant (voir effect ci-dessus). */}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('consent', '${consented ? "grant" : "revoke"}');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* ── Microsoft Clarity ──
         Clarity anonymise les données par défaut (pas d'IP, pas de fingerprint),
         OK RGPD en mode agrégé même sans consent. */}
      {clarityId && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </>
  );
}
