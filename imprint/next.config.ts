import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // This is a marketing-only site for the Casper Buildathon. The pre-pivot
  // product routes (dashboard/login/etc.) are redirected home so a judge never
  // lands on old/broken pages.
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: false },
      { source: "/dashboard", destination: "/", permanent: false },
      { source: "/dashboard/:path*", destination: "/", permanent: false },
      { source: "/onboarding", destination: "/", permanent: false },
      { source: "/chat", destination: "/", permanent: false },
      { source: "/sign-in/:path*", destination: "/", permanent: false },
      { source: "/sign-up/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
