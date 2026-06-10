export type ModelPredictionPoint = {
	timestamp: string
	value: number
}

export const PREDICTION_HOURS_MIN = 1
export const PREDICTION_HOURS_MAX = 15
export const PREDICTION_HOURS_DEFAULT = 10
export const PREDICTION_HOURS_PRESETS = [5, 10, 15] as const

export function resolvePredictionHours(
	presetHours: number,
	customInput: string
): { hours: number } | { error: string } {
	const trimmed = customInput.trim()
	if (trimmed === "") {
		if (
			!Number.isInteger(presetHours) ||
			presetHours < PREDICTION_HOURS_MIN ||
			presetHours > PREDICTION_HOURS_MAX
		) {
			return { hours: PREDICTION_HOURS_DEFAULT }
		}
		return { hours: presetHours }
	}

	if (!/^\d+$/.test(trimmed)) {
		return { error: `Podaj liczbę całkowitą godzin (${PREDICTION_HOURS_MIN}–${PREDICTION_HOURS_MAX}).` }
	}

	const parsed = Number.parseInt(trimmed, 10)
	if (parsed < PREDICTION_HOURS_MIN || parsed > PREDICTION_HOURS_MAX) {
		return {
			error: `Horyzont musi być od ${PREDICTION_HOURS_MIN} do ${PREDICTION_HOURS_MAX} h.`
		}
	}

	return { hours: parsed }
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

async function readPredictionApiErrorMessage(res: Response): Promise<string> {
	const text = await res.text()
	const trimmed = text.trim()
	if (!trimmed) {
		return `Błąd predykcji (HTTP ${res.status}).`
	}
	try {
		const json = JSON.parse(trimmed) as unknown
		if (json && typeof json === "object") {
			const o = json as Record<string, unknown>
			const detail = o.detail
			if (typeof detail === "string") {
				return detail
			}
			if (Array.isArray(detail)) {
				const parts = detail
					.map((item) => {
						if (typeof item === "string") {
							return item
						}
						if (item && typeof item === "object" && "msg" in item) {
							return String((item as { msg: unknown }).msg)
						}
						return null
					})
					.filter((s): s is string => Boolean(s))
				if (parts.length > 0) {
					return parts.join(" ")
				}
			}
			const message = o.message
			if (typeof message === "string") {
				return message
			}
		}
	} catch {
		/* nie JSON */
	}
	return trimmed.length > 400 ? `${trimmed.slice(0, 397)}…` : trimmed
}

export async function fetchModelPredictionPoints(
	stationId: string,
	targetParam: string,
	hours: number = PREDICTION_HOURS_DEFAULT
): Promise<ModelPredictionPoint[]> {
	const encParam = encodeURIComponent(targetParam)
	const encId = encodeURIComponent(stationId)
	const params = new URLSearchParams({ hours: String(hours) })
	const res = await fetch(`/api/model/prediction/${encParam}/${encId}?${params}`)
	if (!res.ok) {
		const detail = await readPredictionApiErrorMessage(res)
		throw new Error(detail)
	}
	const raw: unknown = await res.json()
	return normalizeModelPredictionPayload(raw, targetParam)
}
