import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Désactive Turbopack complètement pour éviter les erreurs de permissions
  // Next.js 16 utilise Webpack par défaut si Turbopack n'est pas disponible
};

export default nextConfig;
