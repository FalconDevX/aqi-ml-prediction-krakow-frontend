"use client"

import { Marker, Tooltip } from "react-leaflet"
import L from "leaflet"
import { useEffect, useMemo, useState } from "react"
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
	selectedMetric: MetricOption
}

type StationMeasurement = {
	timestamp?: string
	values: Record<string, number>
}

const LABELS: Record<string, string> = {
	pm1: "PM1",
	pm25: "PM2.5",
	pm10: "PM10",
	no2: "NO2",
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

export default function Stations({ stations, selectedMetric }: Props) {
	const router = useRouter()
	const [measurementsByStation, setMeasurementsByStation] = useState<Record<number, StationMeasurement>>({})

	useEffect(() => {
		let cancelled = false

		const fetchMeasurements = async () => {
			const entries = await Promise.all(
				stations.map(async (station) => {
					try {
						const res = await fetch(`/api/postgre/measurements/last/${station.id}`)
						if (!res.ok) {
							return null
						}

						const payload = (await res.json()) as Record<string, unknown>
						const values = Object.fromEntries(
							Object.entries(payload).filter(
								([key, value]) => !["id", "station_id", "timestamp"].includes(key) && typeof value === "number"
							)
						) as Record<string, number>

						return [
							station.id,
							{
								timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
								values
							} satisfies StationMeasurement
						] as const
					} catch {
						return null
					}
				})
			)

			if (!cancelled) {
				const nextMeasurements: Record<number, StationMeasurement> = {}
				for (const entry of entries) {
					if (!entry) {
						continue
					}
					const [stationId, measurement] = entry
					nextMeasurements[stationId] = measurement
				}
				setMeasurementsByStation(nextMeasurements)
			}
		}

		fetchMeasurements()

		return () => {
			cancelled = true
		}
	}, [stations])

	const iconByColor = useMemo(() => new Map<string, L.DivIcon>(), [])

	const getIcon = (color: string | undefined) => {
		const c = color ?? DEFAULT_STATION_COLOR
		if (!iconByColor.has(c)) {
			iconByColor.set(c, createStationIcon(c))
		}
		return iconByColor.get(c)!
	}

	const metricRange = useMemo(() => {
		if (!Object.keys(measurementsByStation).length) {
			return null
		}

		const values = Object.values(measurementsByStation)
			.map((item) => item.values[selectedMetric])
			.filter((value): value is number => typeof value === "number")

		if (!values.length) {
			return null
		}

		return { min: Math.min(...values), max: Math.max(...values) }
	}, [measurementsByStation, selectedMetric])

	const getMetricColor = (stationId: number): string => {
		if (selectedMetric === "default") {
			return stations.find((station) => station.id === stationId)?.color ?? DEFAULT_STATION_COLOR
		}

		const metricValue = measurementsByStation[stationId]?.values[selectedMetric]
		if (typeof metricValue !== "number" || !metricRange) {
			return DEFAULT_STATION_COLOR
		}

		const ratio =
			metricRange.max === metricRange.min ? 0.5 : (metricValue - metricRange.min) / (metricRange.max - metricRange.min)
		const hue = 120 - ratio * 120
		return `hsl(${hue} 85% 52%)`
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
							{measurementsByStation[station.id] ? (
								<div className="space-y-0.5">
									{Object.entries(measurementsByStation[station.id].values).map(([key, value]) => (
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
