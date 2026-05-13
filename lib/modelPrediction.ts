export type ModelPredictionPoint = {
	timestamp: string
	value: number
}

function pickTimestamp(row: Record<string, unknown>): string | null {
	for (const key of ["timestamp", "time", "date", "ts", "datetime"] as const) {
		const v = row[key]
		if (typeof v === "string") {
			return v
		}
	}
	return null
}

function pickValue(row: Record<string, unknown>, targetParam: string): number | null {
	const keys = [
		targetParam,
		targetParam.toLowerCase(),
		targetParam.toUpperCase(),
		"prediction",
		"predicted_value",
		"predicted",
		"value",
		"y"
	]
	for (const k of keys) {
		const v = row[k]
		if (typeof v === "number" && Number.isFinite(v)) {
			return v
		}
	}
	const skip = new Set([
		"id",
		"station_id",
		"timestamp",
		"time",
		"date",
		"ts",
		"datetime"
	])
	for (const [k, v] of Object.entries(row)) {
		if (skip.has(k)) {
			continue
		}
		if (typeof v === "number" && Number.isFinite(v)) {
			return v
		}
	}
	return null
}

export function normalizeModelPredictionPayload(
	raw: unknown,
	targetParam: string
): ModelPredictionPoint[] {
	if (Array.isArray(raw)) {
		const out: ModelPredictionPoint[] = []
		for (const row of raw) {
			if (!row || typeof row !== "object") {
				continue
			}
			const o = row as Record<string, unknown>
			const timestamp = pickTimestamp(o)
			const value = pickValue(o, targetParam)
			if (timestamp !== null && value !== null) {
				out.push({ timestamp, value })
			}
		}
		out.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
		return out
	}

	if (raw && typeof raw === "object") {
		const wrap = raw as Record<string, unknown>
		for (const key of ["data", "predictions", "items", "results"] as const) {
			const inner = wrap[key]
			if (inner !== undefined) {
				return normalizeModelPredictionPayload(inner, targetParam)
			}
		}
	}

	return []
}

export async function fetchModelPredictionPoints(
	stationId: string,
	targetParam: string
): Promise<ModelPredictionPoint[]> {
	const encParam = encodeURIComponent(targetParam)
	const encId = encodeURIComponent(stationId)
	const res = await fetch(`/api/model/prediction/${encParam}/${encId}`)
	if (!res.ok) {
		throw new Error(`Model prediction HTTP ${res.status}`)
	}
	const raw: unknown = await res.json()
	return normalizeModelPredictionPayload(raw, targetParam)
}
