"use client";

import { GeoJSON } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";

const STYLE = {
  fillColor: "#3f3f46",
  fillOpacity: 0.5,
  color: "#3f3f46",
  weight: 1,
  opacity: 1,
} as const;

const HOVER_STYLE = {
  fillColor: "#52525b",
  fillOpacity: 0.5,
} as const;

type Props = {
  data: GeoJsonObject;
  name: string;
  zoom: number;
};

export function DistrictLayer({ data, name, zoom }: Props) {
  function onEachFeature(_: unknown, layer: L.Layer) {
    (layer as L.Path).on({
      mouseover: (e) => {
        (e.target as L.Path).setStyle(HOVER_STYLE);
      },
      mouseout: (e) => {
        (e.target as L.Path).setStyle(STYLE);
      },
    });

    if (zoom >= 12) {
      (layer as L.Path).bindTooltip(name, {
        permanent: true,
        direction: "center",
        className: "district-label",
      });
    }
  }

  return <GeoJSON key={zoom} data={data} style={STYLE} onEachFeature={onEachFeature} />;
}

