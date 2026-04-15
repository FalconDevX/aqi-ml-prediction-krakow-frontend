import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/postgre/measurements/last/:id",
        destination: "http://46.225.27.182:8002/postgre/measurements/last/:id",
      },
    ];
  },
};

export default nextConfig;
