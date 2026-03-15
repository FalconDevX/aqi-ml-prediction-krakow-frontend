"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { DistrictsLayer } from "./map/DistrictsLayer";
import { Stations } from "./map/Station";
import stations from "@/public/stations.json";

const CENTER: LatLngExpression = [50.06, 19.94];

export default function Map() {
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden h-full w-full">
      <MapContainer
        center={CENTER}
        zoom={11}
        scrollWheelZoom
        attributionControl={false}
        style={{ height: "100%", width: "100%", backgroundColor: "#000000" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
        <DistrictsLayer />
        <Stations stations={stations} />
      </MapContainer>
    </div>
  );
}
