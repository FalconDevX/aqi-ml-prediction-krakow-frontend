"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Header from "@/components/Header";
import MapOptionsPanel, { type MetricOption } from "@/components/map/MapOptionsPanel";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>("default");

  return (
    <div className="h-screen w-full flex flex-col items-center">
      <Header />

      <div className="mt-10 flex h-[70%] w-[85%] gap-4">
        <div className="h-full flex-1">
          <Map selectedMetric={selectedMetric} />
        </div>
        <div className="flex h-full w-[320px] flex-col gap-4">
          <MapOptionsPanel
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
          />
        </div>
      </div>
    </div>
  );
}
