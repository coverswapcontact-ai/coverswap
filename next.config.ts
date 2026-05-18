import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
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
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
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
  async headers() {
    return [
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
