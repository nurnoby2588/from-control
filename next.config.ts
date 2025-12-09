import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true, // or reactCompiler if that's correct
  productionBrowserSourceMaps: false, // Disable source maps in production
};

export default nextConfig;
