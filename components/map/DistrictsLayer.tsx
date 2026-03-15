"use client";

import { useMapZoom } from "@/hooks/useMapZoom";
import { useDistricts } from "@/hooks/useDistricts";
import { DistrictLayer } from "@/components/map/DistrictLayer";

export function DistrictsLayer() {
  const zoom = useMapZoom();
  const districts = useDistricts();

  return (
    <>
      {districts.map((d, i) => (
        <DistrictLayer key={i} data={d.data} name={d.name} zoom={zoom} />
      ))}
    </>
  );
}

