import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kindaiukdev.blob.core.windows.net",
        port: "",
        pathname: "/**",
      },
    ],
    domains: ["kindaiukdev.blob.core.windows.net"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
