"use client"

import { MapContainer, TileLayer } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { DistrictsLayer } from "./map/DistrictsLayer"
import Stations from "./map/Stations"
import PlotsLayer from "./map/PlotsLayer"
import stations from "@/public/stations.json"
import type { MetricOption } from "./map/MapOptionsPanel"

const CENTER: LatLngExpression = [50.06, 19.94]

type Props = {
	selectedMetric: MetricOption
	plotsVisible?: boolean
}

export default function Map({ selectedMetric, plotsVisible = false }: Props) {
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
				<Stations stations={stations.map((s) => ({ ...s, color: "#84cc16" }))} selectedMetric={selectedMetric} />
				<PlotsLayer visible={plotsVisible} />
			</MapContainer>
		</div>
	)
}
