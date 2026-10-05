import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Profile photos (up to 4 MB, under Vercel's 4.5 MB body cap) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
