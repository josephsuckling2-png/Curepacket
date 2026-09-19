import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "axe-core", "@axe-core/playwright", "@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
