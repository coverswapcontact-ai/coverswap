"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { EVENEMENT_CHANGEMENT, lireChoixCookies } from "@/lib/cookies";

/**
 * Traceurs, chargés selon les choix du bandeau cookies (lib/cookies) :
 *   - Google Tag Manager (NEXT_PUBLIC_GTM_ID) : chargé en Consent Mode v2, tout
 *     refusé par défaut ; « analytics_storage » suit la finalité Mesure
 *     d'audience, « ad_* » la finalité Publicité.
 *   - Google Analytics 4 (NEXT_PUBLIC_GA_ID) : repli sans GTM, seulement avec
 *     l'accord Mesure d'audience.
 *   - Pixel Meta (NEXT_PUBLIC_META_PIXEL_ID) et Microsoft Clarity
 *     (NEXT_PUBLIC_CLARITY_ID) : chargés seulement avec l'accord Publicité.
 * Variable absente = traceur ignoré.
 */
export default function Analytics() {
  const [audience, setAudience] = useState(false);
  const [publicite, setPublicite] = useState(false);

  useEffect(() => {
    const appliquer = () => {
      const choix = lireChoixCookies();
      const okAudience = choix?.audience === true;
      const okPublicite = choix?.publicite === true;
      setAudience(okAudience);
      setPublicite(okPublicite);
      const w = window as unknown as { gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void };
      if (w.gtag) {
        w.gtag("consent", "update", {
          ad_storage: okPublicite ? "granted" : "denied",
          ad_user_data: okPublicite ? "granted" : "denied",
          ad_personalization: okPublicite ? "granted" : "denied",
          analytics_storage: okAudience ? "granted" : "denied",
        });
      }
      if (w.fbq) w.fbq("consent", okPublicite ? "grant" : "revoke");
    };
    appliquer();
    window.addEventListener(EVENEMENT_CHANGEMENT, appliquer);
    return () => window.removeEventListener(EVENEMENT_CHANGEMENT, appliquer);
  }, []);

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <>
      {/* ── Google Consent Mode v2 — défini AVANT GTM, tout refusé par défaut ── */}
      {gtmId && (
        <Script id="gtm-consent-default" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>
      )}

      {/* ── Google Tag Manager — chargé en mode refusé, mis à jour par le bandeau ── */}
      {gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}

      {/* ── Google Analytics 4 (repli sans GTM) — accord Mesure d'audience requis ── */}
      {!gtmId && gaId && audience && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
            `}
          </Script>
        </>
      )}

      {/* ── Pixel Meta — accord Publicité requis ── */}
      {metaPixelId && publicite && (
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
            fbq('consent', 'grant');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* ── Microsoft Clarity — accord Publicité requis ── */}
      {clarityId && publicite && (
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
