import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {}, // Silence l'avertissement Turbopack vs Webpack
};

export default nextConfig;
