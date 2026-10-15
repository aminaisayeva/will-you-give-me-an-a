import type { NextConfig } from "next";

// The macOS desktop (and its apps) is switched off: cooked.ai is the whole
// site now. Its code stays in the repo; its pages just aren't reachable.
const RETIRED = ["/academy", "/mail", "/settings/:path*", "/settings", "/transcript", "/terminal", "/safari/:path*", "/safari", "/welcome", "/s/:path*"];

const nextConfig: NextConfig = {
  async redirects() {
    return RETIRED.map((source) => ({ source, destination: "/", permanent: false }));
  },
  experimental: {
    // Profile photos (up to 4 MB, under Vercel's 4.5 MB body cap) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
