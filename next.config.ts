import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["images.unsplash.com", "placehold.co"],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // This ensures process.env.NODE_ENV is correctly passed to client components
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
};

export default nextConfig;
