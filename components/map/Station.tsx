"use client";

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

type Station = {
  id: number;
  name: string;
  lat: number;
  long: number;
};

type Props = {
  stations: Station[];
};

const squareIcon = L.divIcon({
  className: "station-square",
  iconSize: [10, 10],
});

export function Stations({ stations }: Props) {
  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.lat, station.long]}
          icon={squareIcon}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            {station.name}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
