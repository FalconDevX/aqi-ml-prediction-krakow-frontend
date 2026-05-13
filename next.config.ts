import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/postgre/measurements/last/:id",
        destination: "http://46.225.27.182:8002/postgre/measurements/last/:id",
      },
      {
        source: "/api/model/prediction/:target_param/:station_id",
        destination:
          "http://46.225.27.182:8002/model/prediction/:target_param/:station_id",
      },
    ];
  },
};

export default nextConfig;
