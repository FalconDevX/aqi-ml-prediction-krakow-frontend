"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Map() {
  const position: LatLngExpression = [50.06, 19.94];
  const [districts, setDistricts] = useState<any[]>([]);

  useEffect(() => {
    const files = [
      "/geojson/bienczyce.geojson",
      "/geojson/biezanow_prokocim.geojson",
      "/geojson/bronowice.geojson",
      "/geojson/czyzyny.geojson",
      "/geojson/debniki.geojson",
      "/geojson/grzegorzki.geojson",
      "/geojson/krowodrza.geojson",
      "/geojson/lagiewniki_borek_falecki.geojson",
      "/geojson/mistrzejowice.geojson",
      "/geojson/nowa_huta.geojson",
      "/geojson/podgorze_duchackie.geojson",
      "/geojson/podgorze.geojson",
      "/geojson/prądnik_biały.geojson",
      "/geojson/pradnik_czerwony.geojson",
      "/geojson/stare_miasto.geojson",
      "/geojson/swoszowice.geojson",
      "/geojson/wzgorza_krzeszlawickie.geojson",
      "/geojson/zwierzyniec.geojson",
    ];

    Promise.all(files.map((f) => fetch(f).then((r) => r.json()))).then(
      setDistricts,
    );
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={11}
      scrollWheelZoom
      attributionControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />

      {districts.map((district, i) => (
        <GeoJSON
          key={i}
          data={district}
          style={{
            fillColor: "#3f3f46", 
            fillOpacity: 0.5,
            color: "#3f3f46", 
            weight: 1,
            opacity: 1,
          }}
          onEachFeature={(feature, layer) => {
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
