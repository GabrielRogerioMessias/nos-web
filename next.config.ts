import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost:8081"],
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "filesystem",
      };
    }
    return config;
  },
};

export default nextConfig;
