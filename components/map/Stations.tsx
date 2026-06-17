"use client"

import { colorAtConcentration, getValueColorScaleForMetric } from "@/lib/chartMetricColorScales"
import { colorAtDataValue, metricDataRangeFromStations } from "@/lib/dataDrivenColors"
import type { StationMeasurementsMap } from "@/hooks/useStationMeasurements"
import { Marker, Tooltip } from "react-leaflet"
import L from "leaflet"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import type { MetricOption } from "./MapOptionsPanel"

const DEFAULT_STATION_COLOR = "#9ca3af"

type Station = {
	id: number
	name: string
	lat: number
	long: number
	color: string
}

type Props = {
	stations: Station[]
	measurements: StationMeasurementsMap
	selectedMetric: MetricOption
	colorsFromData?: boolean
}

const LABELS: Record<string, string> = {
	pm1: "PM1",
	pm25: "PM2.5",
	pm10: "PM10",
	no2: "NO2",
	no: "NO",
	so2: "SO2",
	co: "CO",
	o3: "O3",
	caqi: "CAQI"
}

function createStationIcon(color: string = DEFAULT_STATION_COLOR) {
	return L.divIcon({
		className: "station-square",
		iconSize: [10, 10],
		html: `<div style="width:10px;height:10px;background:${color};border-radius:2px;border:none"></div>`
	})
}

export default function Stations({
	stations,
	measurements,
	selectedMetric,
	colorsFromData = false
}: Props) {
	const router = useRouter()

	const dataRange = useMemo(() => {
		if (!colorsFromData || selectedMetric === "default") {
			return null
		}
		return metricDataRangeFromStations(stations, measurements, selectedMetric)
	}, [colorsFromData, selectedMetric, stations, measurements])

	const iconByColor = useMemo(() => new Map<string, L.DivIcon>(), [])

	const getIcon = (color: string | undefined) => {
		const c = color ?? DEFAULT_STATION_COLOR
		if (!iconByColor.has(c)) {
			iconByColor.set(c, createStationIcon(c))
		}
		return iconByColor.get(c)!
	}

	const getMetricColor = (stationId: number): string => {
		if (selectedMetric === "default") {
			return stations.find((station) => station.id === stationId)?.color ?? DEFAULT_STATION_COLOR
		}

		const metricValue = measurements[stationId]?.values[selectedMetric]
		if (typeof metricValue !== "number") {
			return DEFAULT_STATION_COLOR
		}

		if (colorsFromData && dataRange) {
			return colorAtDataValue(metricValue, dataRange.min, dataRange.max)
		}

		const scale = getValueColorScaleForMetric(selectedMetric)
		if (!scale) {
			return DEFAULT_STATION_COLOR
		}

		return colorAtConcentration(scale, metricValue)
	}

	return (
		<>
			{stations.map((station) => (
				<Marker
					key={station.id}
					position={[station.lat, station.long]}
					icon={getIcon(getMetricColor(station.id))}
					eventHandlers={{
						click: () => router.push(`/stations/${station.id}`)
					}}
				>
					<Tooltip direction="top" className="border-2 border-gray-700" offset={[0, -10]}>
						<div className="text-xs">
							<div className="mb-1 font-semibold">{station.name}</div>
							{measurements[station.id] ? (
								<div className="space-y-0.5">
									{Object.entries(measurements[station.id].values).map(([key, value]) => (
										<div key={key}>
											{LABELS[key] ?? key.toUpperCase()}: {value}
										</div>
									))}
								</div>
							) : (
								<div className="text-zinc-400">Brak danych pomiarowych</div>
							)}
						</div>
					</Tooltip>
				</Marker>
			))}
		</>
	)
}
