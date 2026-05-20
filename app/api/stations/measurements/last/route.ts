import stationsJson from "@/public/stations.json"
import { NextResponse } from "next/server"

const API_BASE = "http://46.225.27.182:8002"
const CHUNK_SIZE = 12
const CACHE_SECONDS = 60

export type StationMeasurementPayload = {
	timestamp?: string
	values: Record<string, number>
}

export type StationMeasurementsBatch = Record<number, StationMeasurementPayload>

function parsePayload(payload: Record<string, unknown>): StationMeasurementPayload {
	const values = Object.fromEntries(
		Object.entries(payload).filter(
			([key, value]) =>
				!["id", "station_id", "timestamp"].includes(key) && typeof value === "number"
		)
	) as Record<string, number>

	return {
		timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
		values
	}
}

async function fetchLastMeasurement(stationId: number): Promise<[number, StationMeasurementPayload] | null> {
	try {
		const res = await fetch(`${API_BASE}/postgre/measurements/last/${stationId}`, {
			next: { revalidate: CACHE_SECONDS }
		})
		if (!res.ok) {
			return null
		}
		const payload = (await res.json()) as Record<string, unknown>
		return [stationId, parsePayload(payload)]
	} catch {
		return null
	}
}

async function fetchAllMeasurements(): Promise<StationMeasurementsBatch> {
	const ids = stationsJson.map((station) => station.id)
	const batch: StationMeasurementsBatch = {}

	for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
		const chunk = ids.slice(i, i + CHUNK_SIZE)
		const entries = await Promise.all(chunk.map(fetchLastMeasurement))
		for (const entry of entries) {
			if (!entry) {
				continue
			}
			const [stationId, measurement] = entry
			batch[stationId] = measurement
		}
	}

	return batch
}

export async function GET() {
	const data = await fetchAllMeasurements()

	return NextResponse.json(data, {
		headers: {
			"Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=120`
		}
	})
}
