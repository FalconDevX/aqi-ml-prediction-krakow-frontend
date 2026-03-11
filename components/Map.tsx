"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { LatLngExpression } from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";

const DISTRICT_FILES: { path: string; name: string }[] = [
  { path: "/geojson/bienczyce.geojson", name: "Bienczyce" },
  { path: "/geojson/biezanow_prokocim.geojson", name: "Bieżanów-Prokocim" },
  { path: "/geojson/bronowice.geojson", name: "Bronowice" },
  { path: "/geojson/czyzyny.geojson", name: "Czyżyny" },
  { path: "/geojson/debniki.geojson", name: "Dębniki" },
  { path: "/geojson/grzegorzki.geojson", name: "Grzegorzki" },
  { path: "/geojson/krowodrza.geojson", name: "Krowodrza" },
  { path: "/geojson/lagiewniki_borek_falecki.geojson", name: "Łagiewniki-Borek Falecki" },
  { path: "/geojson/mistrzejowice.geojson", name: "Mistrzejowice" },
  { path: "/geojson/nowa_huta.geojson", name: "Nowa Huta" },
  { path: "/geojson/podgorze_duchackie.geojson", name: "Podgórze Duchackie" },
  { path: "/geojson/podgorze.geojson", name: "Podgórze" },
  { path: "/geojson/prądnik_biały.geojson", name: "Prądnik Biały" },
  { path: "/geojson/pradnik_czerwony.geojson", name: "Prądnik Czerwony" },
  { path: "/geojson/stare_miasto.geojson", name: "Stare Miasto" },
  { path: "/geojson/swoszowice.geojson", name: "Swoszowice" },
  { path: "/geojson/wzgorza_krzeszlawickie.geojson", name: "Wzgórza Krzesławickie" },
  { path: "/geojson/zwierzyniec.geojson", name: "Zwierzyniec" },
];

export default function Map() {
  const position: LatLngExpression = [50.06, 19.94];
  const [districts, setDistricts] = useState<{ data: GeoJsonObject; name: string }[]>([]);

  useEffect(() => {
    Promise.all(
      DISTRICT_FILES.map(async ({ path, name }) => {
        const res = await fetch(path);
        const data = (await res.json()) as GeoJsonObject;
        return { data, name };
      }),
    ).then(setDistricts);
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={11}
      scrollWheelZoom
      attributionControl={false}
      style={{ height: "100%", width: "100%", backgroundColor: "#000000" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />

      {districts.map((district, i) => (
        <GeoJSON
          key={i}
          data={district.data}
          style={{
            fillColor: "#3f3f46",
            fillOpacity: 0.5,
            color: "#3f3f46",
            weight: 1,
            opacity: 1,
          }}
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(district.name, {
              permanent: true,
              direction: "center",
              className: "district-label",
            });
            layer.on({
              mouseover: (e) => {
                e.target.setStyle({
                  fillColor: "#52525b",  
                  fillOpacity: 0.5
                });
              },
              mouseout: (e) => {
                e.target.setStyle({
                  fillColor: "#3f3f46",
                  fillOpacity: 0.5,
                });
              }
            });
          }}
        />
      ))}
    </MapContainer>
  );
}
