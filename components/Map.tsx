"use client"

import { MapContainer, TileLayer } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { DistrictsLayer } from "./map/DistrictsLayer"
import Stations from "./map/Stations"
import MetricInterpolationLayer from "./map/MetricInterpolationLayer"
import { useStationMeasurements } from "@/hooks/useStationMeasurements"
import { STATIONS } from "@/lib/stations"
import type { MetricOption } from "./map/MapOptionsPanel"
import { useMemo } from "react"

const CENTER: LatLngExpression = [50.06, 19.94]

type Props = {
	selectedMetric: MetricOption
	geospatialApprox?: boolean
	visibleStationIds?: Set<number> | null
}

export default function Map({
	selectedMetric,
	geospatialApprox = false,
	visibleStationIds = null
}: Props) {
	const measurements = useStationMeasurements()

	const visibleStations = useMemo(() => {
		if (!visibleStationIds) {
			return STATIONS
		}
		return STATIONS.filter((station) => visibleStationIds.has(station.id))
	}, [visibleStationIds])

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
				<Stations
					stations={visibleStations}
					measurements={measurements}
					selectedMetric={selectedMetric}
				/>
				<MetricInterpolationLayer
					stations={visibleStations}
					measurements={measurements}
					selectedMetric={selectedMetric}
					enabled={geospatialApprox}
				/>
			</MapContainer>
		</div>
	)
}
