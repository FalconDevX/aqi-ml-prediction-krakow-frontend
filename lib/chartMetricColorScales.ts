import {
	airQualityScaleToValueColorScale,
	METRIC_KEY_TO_AIR_QUALITY_SCALE
} from "@/lib/airQualityScales"
import type { ValueColorScale } from "@/lib/valueColorScaleTypes"

export type { ValueColorScale, ValueScaleStop } from "@/lib/valueColorScaleTypes"

export {
	AIR_QUALITY_SCALES,
	airQualityScaleToValueColorScale,
	METRIC_KEY_TO_AIR_QUALITY_SCALE,
	type AirQualityScaleKey,
	type AirQualityScaleDef,
	type AirQualityRange
} from "@/lib/airQualityScales"

/** Zachowane nazwy eksportów pod testy i ewentualne importy zewnętrzne. */
export const PM10_VALUE_SCALE = airQualityScaleToValueColorScale("PM10")
export const PM25_VALUE_SCALE = airQualityScaleToValueColorScale("PM25")
export const CAQI_VALUE_SCALE = airQualityScaleToValueColorScale("CAQI")
export const NO2_VALUE_SCALE = airQualityScaleToValueColorScale("NO2")
export const CO_VALUE_SCALE = airQualityScaleToValueColorScale("CO")

export function getValueColorScaleForMetric(metricKey: string): ValueColorScale | undefined {
	const scaleKey = METRIC_KEY_TO_AIR_QUALITY_SCALE[metricKey.toLowerCase()]
	return scaleKey ? airQualityScaleToValueColorScale(scaleKey) : undefined
}

function isCssVarRef(ref: string): boolean {
	return ref.startsWith("--")
}

function readCssVar(name: string): string {
	if (typeof document === "undefined") {
		return ""
	}
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function resolveStopColor(ref: string): string {
	if (!isCssVarRef(ref)) {
		return ref
	}
	const v = readCssVar(ref)
	return v || "#a3e635"
}

function parseHex(hex: string): { r: number; g: number; b: number } {
	const h = hex.replace("#", "").trim()
	const n = h.length === 3 ? parseInt(h.split("").map((c) => c + c).join(""), 16) : parseInt(h, 16)
	if (Number.isNaN(n)) {
		return { r: 163, g: 230, b: 53 }
	}
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function formatRgb({ r, g, b }: { r: number; g: number; b: number }): string {
	return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

type Rgb = { r: number; g: number; b: number }

export function colorAtConcentration(scale: ValueColorScale, value: number): string {
	const v = Number.isFinite(value) ? value : 0
	const { stops } = scale
	if (stops.length === 0) {
		return "#a3e635"
	}

	const finite = stops.filter((s) => s.until < Number.POSITIVE_INFINITY)
	const lastEdge = finite.length ? finite[finite.length - 1]!.until : 0
	const hazardous = parseHex(resolveStopColor(stops[stops.length - 1]!.color))

	if (v > lastEdge) {
		return formatRgb(hazardous)
	}

	const anchors: { v: number; rgb: Rgb }[] = [
		{ v: 0, rgb: parseHex(resolveStopColor(stops[0]!.color)) }
	]
	for (const s of finite) {
		anchors.push({ v: s.until, rgb: parseHex(resolveStopColor(s.color)) })
	}

	for (let i = 0; i < anchors.length - 1; i += 1) {
		const lo = anchors[i]!
		const hi = anchors[i + 1]!
		if (v <= hi.v) {
			const span = hi.v - lo.v
			const t = span <= 0 ? 0 : Math.max(0, Math.min(1, (v - lo.v) / span))
			return formatRgb({
				r: lerp(lo.rgb.r, hi.rgb.r, t),
				g: lerp(lo.rgb.g, hi.rgb.g, t),
				b: lerp(lo.rgb.b, hi.rgb.b, t)
			})
		}
	}

	return formatRgb(hazardous)
}

export function scaleToCssBandGradient(scale: ValueColorScale): string {
	const finite = scale.stops.filter((s) => s.until < Number.POSITIVE_INFINITY)
	const max = finite.length ? finite[finite.length - 1]!.until : 300
	if (max <= 0) {
		return resolveStopColor(scale.stops[0]?.color ?? "#888888")
	}
	const inf = scale.stops.find((s) => s.until === Number.POSITIVE_INFINITY)
	const parts: string[] = []
	const firstCol = resolveStopColor(scale.stops[0]?.color ?? "#888888")
	parts.push(`${firstCol} 0%`)

	for (const s of finite) {
		let pct = Math.min(100, (s.until / max) * 100)
		if (inf && finite.length > 0 && s.until === finite[finite.length - 1]!.until) {
			pct = Math.min(pct, 99.6)
		}
		parts.push(`${resolveStopColor(s.color)} ${pct.toFixed(2)}%`)
	}
	if (inf) {
		parts.push(`${resolveStopColor(inf.color)} 100%`)
	}
	return `linear-gradient(90deg, ${parts.join(", ")})`
}

export type ScaleLegendTick = {
	value: number
	positionPct: number
}

export function valueScaleLegendTicks(scale: ValueColorScale): ScaleLegendTick[] {
	const finite = scale.stops.filter((s) => s.until < Number.POSITIVE_INFINITY)
	const max = finite.length ? finite[finite.length - 1]!.until : 300
	if (max <= 0) {
		return [{ value: 0, positionPct: 0 }]
	}
	const ticks: ScaleLegendTick[] = [{ value: 0, positionPct: 0 }]
	for (const s of finite) {
		ticks.push({ value: s.until, positionPct: Math.min(100, (s.until / max) * 100) })
	}
	return ticks
}
