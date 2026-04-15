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
 * Comportement RGPD :
 *   - Aucun script chargé tant que l'utilisateur n'a pas accepté les cookies.
 *   - Réécoute l'event "cookie-consent-change" pour s'activer dès l'accept.
 *   - Si une variable d'env est manquante, le tracker correspondant est ignoré.
 */
export default function Analytics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        setConsented(localStorage.getItem("cookie-consent") === "accepted");
      } catch {
        setConsented(false);
      }
    };
    check();
    window.addEventListener("cookie-consent-change", check);
    return () => window.removeEventListener("cookie-consent-change", check);
  }, []);

  if (!consented) return null;

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <>
      {/* ── Google Tag Manager (prioritaire sur GA4 standalone) ── */}
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
          {/* noscript fallback via layout.tsx n'est pas nécessaire en SPA Next.js */}
        </>
      )}

      {/* ── Google Analytics 4 (fallback si pas de GTM) ── */}
      {!gtmId && gaId && (
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

      {/* ── Meta Pixel ── */}
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
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* ── Microsoft Clarity ── */}
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
