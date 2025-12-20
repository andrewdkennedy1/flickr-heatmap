import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for optimal Cloudflare Workers deployment
  output: "standalone",

  // Disable image optimization (not supported in Workers)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
