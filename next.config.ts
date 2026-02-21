import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Avoid ESM resolution issues with eslint-config-next on Vercel build
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
