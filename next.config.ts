import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
};

export default nextConfig;
