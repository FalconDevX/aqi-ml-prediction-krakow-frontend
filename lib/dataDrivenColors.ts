type Rgb = { r: number; g: number; b: number }

/** Ciemny (min) → jasny (max); niezależna od palety norm. */
const DATA_GRADIENT_STOPS: Array<{ t: number; rgb: Rgb }> = [
	{ t: 0, rgb: { r: 18, g: 22, b: 58 } },
	{ t: 0.4, rgb: { r: 35, g: 110, b: 145 } },
	{ t: 0.7, rgb: { r: 130, g: 205, b: 95 } },
	{ t: 1, rgb: { r: 255, g: 238, b: 110 } }
]

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
	return {
		r: lerp(a.r, b.r, t),
		g: lerp(a.g, b.g, t),
		b: lerp(a.b, b.b, t)
	}
}

function formatRgb({ r, g, b }: Rgb): string {
	return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

function colorAtNormalizedT(t: number): string {
	const clamped = Math.max(0, Math.min(1, t))
	for (let i = 0; i < DATA_GRADIENT_STOPS.length - 1; i += 1) {
		const lo = DATA_GRADIENT_STOPS[i]!
		const hi = DATA_GRADIENT_STOPS[i + 1]!
		if (clamped <= hi.t) {
			const span = hi.t - lo.t
			const localT = span <= 0 ? 0 : (clamped - lo.t) / span
			return formatRgb(lerpRgb(lo.rgb, hi.rgb, localT))
		}
	}
	return formatRgb(DATA_GRADIENT_STOPS.at(-1)!.rgb)
}

export function colorAtDataValue(value: number, dataMin: number, dataMax: number): string {
	if (!Number.isFinite(value)) {
		return colorAtNormalizedT(0)
	}
	if (dataMax <= dataMin) {
		return colorAtNormalizedT(0.5)
	}
	const t = (value - dataMin) / (dataMax - dataMin)
	return colorAtNormalizedT(t)
}

export function dataDrivenCssGradient(): string {
	const parts = DATA_GRADIENT_STOPS.map(
		(stop) => `${formatRgb(stop.rgb)} ${(stop.t * 100).toFixed(1)}%`
	)
	return `linear-gradient(90deg, ${parts.join(", ")})`
}

export type MetricDataRange = { min: number; max: number }

export function collectMetricValues(
	stations: Array<{ id: number }>,
	measurements: Record<number, { values: Record<string, unknown> } | undefined>,
	metricKey: string
): number[] {
	const values: number[] = []
	for (const station of stations) {
		const value = measurements[station.id]?.values[metricKey]
		if (typeof value === "number" && Number.isFinite(value)) {
			values.push(value)
		}
	}
	return values
}

export function metricDataRangeFromStations(
	stations: Array<{ id: number }>,
	measurements: Record<number, { values: Record<string, unknown> } | undefined>,
	metricKey: string
): MetricDataRange | null {
	const values = collectMetricValues(stations, measurements, metricKey)
	if (values.length === 0) {
		return null
	}
	return { min: Math.min(...values), max: Math.max(...values) }
}
