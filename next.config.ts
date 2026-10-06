import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    // Aucune optimisation à la volée, et c'est voulu (mission 16, partie 6) : le quota d'images du plan Vercel Hobby
    // était épuisé (HTTP 402, catalogue vide), et chaque image optimisée à la demande coûte une fonction et un délai.
    // Les échantillons Cover Styl' (S3) sont déjà petits ; les images du site sont produites en local, UNE fois, aux
    // bonnes tailles et formats (AVIF, WebP, JPEG ; 480 / 960 / 1600) par scripts/preparer-images.mjs (`npm run
    // images`, composant `Photo`), les fonds des guides par scripts/importer-fonds.mjs ; les photos publiées par le
    // CRM sont réduites par le CRM (`?l=`). Tout est servi tel quel par srcset, en cache immuable (headers() plus bas).
    unoptimized: true,
    // Qualités autorisées (requis à partir de Next 16)
    qualities: [60, 75, 80, 85, 90],
    formats: ["image/avif", "image/webp"],
    // Largeurs autorisées pour /_next/image — DOIT inclure toutes les valeurs
    // utilisées dans les `sizes=` des <Image /> du codebase, sinon Vercel renvoie
    // HTTP 400 INVALID_IMAGE_OPTIMIZE_REQUEST et les textures ne s'affichent pas.
    // Sizes utilisés : 32, 40, 48, 80, 96, 128, 140, 256, 384 (composants)
    //                  600, 640, 700, 750, 828, 960, 1080, 1200, 1920, 2048, 3840 (devices)
    imageSizes: [16, 32, 40, 48, 64, 80, 96, 128, 140, 256, 384],
    deviceSizes: [600, 640, 700, 750, 828, 960, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ssi.s3.fr-par.scw.cloud",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cms.coverstyl.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    // Site 3.0 (lot F3) : toutes en 301 (`statusCode`, plus `permanent` qui répond 308) ; le changement d'hôte (www et
    // coverswap.vercel.app → coverswap.fr) est dans vercel.json, avant le site. Docs : docs/SEO.md, « Un seul hôte ».
    // L'ancien simulateur vivait sur /simulation ; l'adresse est indexée et partagée.
    return [
      { source: "/simulation", destination: "/simulateur", statusCode: 301 },
      // Ancien article daté ; son sujet vit dans un guide sans date.
      { source: "/blog/tendances-deco-2025-covering", destination: "/blog/quelle-finition-choisir", statusCode: 301 },
      // Mission 16 (partie 4) : le devis passe par la simulation (tunnel) ; la page pro devient /pro. Test : src/redirections.test.ts.
      { source: "/devis", destination: "/simulateur", statusCode: 301 },
      { source: "/prestations/professionnel", destination: "/pro", statusCode: 301 },
      // Mission 16 (partie 5) : le catalogue devient /matieres (`?famille=` et `?ref=` passent tels quels : Next garde la
      // requête), l'index des prestations mène aux réalisations (les pages par pièce gardent leur adresse), l'index du
      // blog mène à « Comment ça marche » (les guides gardent la leur). Sonde en ligne : scripts/verifier-redirections.mjs.
      { source: "/revetements", destination: "/matieres", statusCode: 301 },
      { source: "/prestations", destination: "/realisations", statusCode: 301 },
      { source: "/blog", destination: "/comment-ca-marche", statusCode: 301 },
    ];
  },
  async headers() {
    // Mission 16 (partie 6) : les images préparées et les polices → un an en cache, immuable. Un original remplacé
    // garde son nom de fichier, mais chaque adresse d'image préparée porte l'empreinte de son original (`?v=`,
    // `sourcesPhoto` de src/lib/images-preparees.ts) : une image refaite change d'adresse. Les polices de next/font
    // sont servies par /_next/static (déjà immuables) ; /fonts/* couvre une police posée à la main dans public/fonts.
    const IMMUABLE = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/images/prep/:path*", headers: IMMUABLE },
      { source: "/fonts/:path*", headers: IMMUABLE },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
