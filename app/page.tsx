"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import MapOptionsPanel, { type MetricOption } from "@/components/map/MapOptionsPanel";
import StationSearch from "@/components/map/StationSearch";
import { prefetchDistricts } from "@/hooks/useDistricts";
import { prefetchStationMeasurements } from "@/hooks/useStationMeasurements";
import { getFilteredStationIds } from "@/lib/stationSearch";
import { STATIONS } from "@/lib/stations";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-gray-700 bg-[#0b0e14] text-sm text-zinc-400">
      Ładowanie mapy…
    </div>
  ),
});

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>("default");
  const [geospatialApprox, setGeospatialApprox] = useState(false);
  const [stationSearchQuery, setStationSearchQuery] = useState("");

  const visibleStationIds = useMemo(
    () => getFilteredStationIds(STATIONS, stationSearchQuery),
    [stationSearchQuery],
  );

  useEffect(() => {
    void import("@/components/Map");
    void prefetchStationMeasurements();
    void prefetchDistricts();
  }, []);

  return (
    <div className="h-screen w-full flex flex-col items-center">
      <Header />

      <div className="mt-10 flex h-[70%] w-[85%] gap-4">
        <div className="h-full flex-1">
          <Map
            selectedMetric={selectedMetric}
            geospatialApprox={geospatialApprox}
            visibleStationIds={visibleStationIds}
          />
        </div>
        <div className="flex h-full w-[320px] flex-col gap-4 overflow-y-auto">
          <StationSearch
            stations={STATIONS}
            query={stationSearchQuery}
            onQueryChange={setStationSearchQuery}
          />
          <MapOptionsPanel
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
            geospatialApprox={geospatialApprox}
            onGeospatialApproxChange={setGeospatialApprox}
          />
        </div>
      </div>
    </div>
  );
}
