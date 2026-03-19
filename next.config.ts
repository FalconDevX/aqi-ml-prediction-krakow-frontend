import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/stations/current/color/:id",
        destination: "http://46.225.27.182:8002/stations/current/color/:id",
      },
    ];
  },
};

export default nextConfig;
