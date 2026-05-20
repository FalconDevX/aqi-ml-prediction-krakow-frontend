"use client"

import { createTimedCache } from "@/lib/clientDataCache"
import { useEffect, useState } from "react"

export type StationMeasurement = {
	timestamp?: string
	values: Record<string, number>
}

export type StationMeasurementsMap = Record<number, StationMeasurement>

const MEASUREMENTS_CACHE_TTL_MS = 5 * 60_000
const measurementsCache = createTimedCache<StationMeasurementsMap>(MEASUREMENTS_CACHE_TTL_MS)

export async function fetchAllStationMeasurements(): Promise<StationMeasurementsMap> {
	const res = await fetch("/api/stations/measurements/last")
	if (!res.ok) {
		return {}
	}
	return (await res.json()) as StationMeasurementsMap
}

export function prefetchStationMeasurements(): Promise<StationMeasurementsMap> {
	return measurementsCache.load(fetchAllStationMeasurements)
}

export function useStationMeasurements(): StationMeasurementsMap {
	const [measurementsByStation, setMeasurementsByStation] = useState<StationMeasurementsMap>(
		() => measurementsCache.get() ?? {}
	)

	useEffect(() => {
		let cancelled = false

		prefetchStationMeasurements().then((data) => {
			if (!cancelled) {
				setMeasurementsByStation(data)
			}
		})

		return () => {
			cancelled = true
		}
	}, [])

	return measurementsByStation
}
