"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Header from "@/components/Header";
import MapOptionsPanel, { type MetricOption } from "@/components/map/MapOptionsPanel";
import PromptPanel from "@/components/PromptPanel";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

export default function Home() {
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>("default");
  const [plotsVisible, setPlotsVisible] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col items-center">
      <Header />

      <div className="mt-10 flex h-[70%] w-[85%] gap-4">
        <div className="h-full flex-1">
          <Map selectedMetric={selectedMetric} plotsVisible={plotsVisible} />
        </div>
        <div className="flex h-full w-[320px] flex-col gap-4">
          <MapOptionsPanel
            selectedMetric={selectedMetric}
            onMetricChange={setSelectedMetric}
          />
          <div className="min-h-0 flex-1">
            <PromptPanel
              onMatch={() => setPlotsVisible(true)}
              onReset={() => setPlotsVisible(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
