import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Avoid ESM resolution issues with eslint-config-next on Vercel build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
