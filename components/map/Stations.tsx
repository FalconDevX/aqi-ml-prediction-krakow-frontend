"use client";

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_STATION_COLOR = "#9ca3af";

type Station = {
  id: number;
  name: string;
  lat: number;
  long: number;
  color: string;
};

type Props = {
  stations: Station[];
};

function createStationIcon(color: string = DEFAULT_STATION_COLOR) {
  return L.divIcon({
    className: "station-square",
    iconSize: [10, 10],
    html: `<div style="width:10px;height:10px;background:${color};border-radius:2px;border:none"></div>`,
  });
}

export default function Stations({ stations }: Props) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const ids = stations.map((s) => s.id);
    return () => {
      cancelled = true;
    };
  }, [stations]);

  const iconByColor = useMemo(() => new Map<string, L.DivIcon>(), []);

  const getIcon = (color: string | undefined) => {
    const c = color ?? DEFAULT_STATION_COLOR;
    if (!iconByColor.has(c)) {
      iconByColor.set(c, createStationIcon(c));
    }
    return iconByColor.get(c)!;
  };

  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.lat, station.long]}
          icon={getIcon(station.color)}
          eventHandlers={{
            click: () => router.push(`/stations/${station.id}`),
          }}
        >
          <Tooltip direction="top" className="border-2 border-gray-700" offset={[0, -10]}>
            {station.name}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
