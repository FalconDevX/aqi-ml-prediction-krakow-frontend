import { colorAtConcentration, type ValueColorScale } from "@/lib/chartMetricColorScales"
import type { LineData, Time, UTCTimestamp, WhitespaceData } from "lightweight-charts"

export type MeasurementPoint = {
	timestamp: string
	value: number
}

export type ChartSeriesPoint = LineData<Time> | WhitespaceData<Time>

const MIN_GAP_MS = 2 * 60 * 60 * 1000
const GAP_MULTIPLIER = 2.5
const DEFAULT_STEP_MS = 60 * 60 * 1000
const MAX_CADENCE_INTERVAL_MS = 6 * 60 * 60 * 1000

export function sortMeasurementPoints(points: MeasurementPoint[]): MeasurementPoint[] {
	return [...points].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
}

function toUtcSecond(timestamp: string): number | null {
	const ms = Date.parse(timestamp)
	if (Number.isNaN(ms)) {
		return null
	}
	return Math.floor(ms / 1000)
}

export function estimateSeriesStepMs(sortedPoints: MeasurementPoint[]): number {
	const deltas: number[] = []

	for (let i = 1; i < sortedPoints.length; i += 1) {
		const prev = toUtcSecond(sortedPoints[i - 1]!.timestamp)
		const next = toUtcSecond(sortedPoints[i]!.timestamp)
		if (prev === null || next === null) {
			continue
		}
		const deltaMs = (next - prev) * 1000
		if (deltaMs > 0 && deltaMs <= MAX_CADENCE_INTERVAL_MS) {
			deltas.push(deltaMs)
		}
	}

	if (deltas.length === 0) {
		return DEFAULT_STEP_MS
	}

	deltas.sort((a, b) => a - b)
	const median = deltas[Math.floor(deltas.length / 2)]!
	return Math.max(DEFAULT_STEP_MS / 4, median)
}

export function gapThresholdMs(stepMs: number): number {
	return Math.max(MIN_GAP_MS, Math.round(stepMs * GAP_MULTIPLIER))
}

export function connectPredictionToLastMeasurement(
	measuredPoints: MeasurementPoint[],
	predictionPoints: MeasurementPoint[]
): MeasurementPoint[] {
	const sortedPredictions = sortMeasurementPoints(predictionPoints)
	if (sortedPredictions.length === 0) {
		return []
	}

	const lastMeasured = sortMeasurementPoints(measuredPoints).at(-1)
	if (!lastMeasured) {
		return sortedPredictions
	}

	const lastMeasuredMs = Date.parse(lastMeasured.timestamp)
	const futurePredictions = sortedPredictions.filter(
		(point) => Date.parse(point.timestamp) > lastMeasuredMs
	)

	return [lastMeasured, ...futurePredictions]
}

export function splitMeasurementPointsByGaps(points: MeasurementPoint[]): MeasurementPoint[][] {
	const sorted = sortMeasurementPoints(points)
	if (sorted.length === 0) {
		return []
	}

	const stepMs = estimateSeriesStepMs(sorted)
	const gapThreshold = gapThresholdMs(stepMs)
	const segments: MeasurementPoint[][] = []
	let current: MeasurementPoint[] = [sorted[0]!]

	for (let i = 1; i < sorted.length; i += 1) {
		const prevSec = toUtcSecond(sorted[i - 1]!.timestamp)
		const nextSec = toUtcSecond(sorted[i]!.timestamp)
		if (prevSec !== null && nextSec !== null) {
			const gapMs = (nextSec - prevSec) * 1000
			if (gapMs > gapThreshold) {
				segments.push(current)
				current = []
			}
		}
		current.push(sorted[i]!)
	}

	segments.push(current)
	return segments
}

function pushUniqueTime(
	out: ChartSeriesPoint[],
	seen: Set<number>,
	sec: number,
	item?: LineData<Time>
): void {
	let time = sec
	while (seen.has(time)) {
		time += 1
	}
	seen.add(time)
	out.push(item ? { ...item, time: time as UTCTimestamp } : { time: time as UTCTimestamp })
}

export function measurementPointsToChartSeries(
	points: MeasurementPoint[],
	valueScale?: ValueColorScale,
	options?: { breakGaps?: boolean }
): ChartSeriesPoint[] {
	const breakGaps = options?.breakGaps ?? true
	const sorted = sortMeasurementPoints(points)
	if (sorted.length === 0) {
		return []
	}

	const stepMs = estimateSeriesStepMs(sorted)
	const gapThreshold = gapThresholdMs(stepMs)
	const out: ChartSeriesPoint[] = []
	const seen = new Set<number>()

	for (let i = 0; i < sorted.length; i += 1) {
		const point = sorted[i]!
		const sec = toUtcSecond(point.timestamp)
		if (sec === null) {
			continue
		}

		if (breakGaps && i > 0) {
			const prevSec = toUtcSecond(sorted[i - 1]!.timestamp)
			if (prevSec !== null) {
				const gapMs = (sec - prevSec) * 1000
				if (gapMs > gapThreshold) {
					const breakSec = prevSec + Math.max(1, Math.floor(stepMs / 1000))
					if (!seen.has(breakSec) && breakSec < sec) {
						pushUniqueTime(out, seen, breakSec)
					}
				}
			}
		}

		const item: LineData<Time> = {
			time: sec as UTCTimestamp,
			value: point.value
		}
		if (valueScale) {
			item.color = colorAtConcentration(valueScale, point.value)
		}
		pushUniqueTime(out, seen, sec, item)
	}

	return out
}

export function buildWhitespaceTimeScaleSeries(
	points: MeasurementPoint[],
	extraPoints: MeasurementPoint[] = []
): WhitespaceData<Time>[] {
	const all = sortMeasurementPoints([...points, ...extraPoints])
	if (all.length === 0) {
		return []
	}

	const firstSec = toUtcSecond(all[0]!.timestamp)
	const lastSec = toUtcSecond(all.at(-1)!.timestamp)
	if (firstSec === null || lastSec === null || lastSec < firstSec) {
		return []
	}

	const stepMs = Math.min(estimateSeriesStepMs(all), DEFAULT_STEP_MS)
	const stepSec = Math.max(1, Math.floor(stepMs / 1000))
	const out: WhitespaceData<Time>[] = []

	for (let sec = firstSec; sec <= lastSec; sec += stepSec) {
		out.push({ time: sec as UTCTimestamp })
	}

	const lastPointSec = toUtcSecond(all.at(-1)!.timestamp)
	if (lastPointSec !== null && (out.length === 0 || out.at(-1)!.time !== lastPointSec)) {
		out.push({ time: lastPointSec as UTCTimestamp })
	}

	return out
}
