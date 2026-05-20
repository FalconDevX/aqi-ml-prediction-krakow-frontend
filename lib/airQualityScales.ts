import type { ValueColorScale, ValueScaleStop } from "@/lib/valueColorScaleTypes"

export type AirQualityRange = {
	max: number
	color: string
	label: string
}

export type AirQualityScaleDef = {
	label: string
	unit: string
	ranges: readonly AirQualityRange[]
}

const EEA_BAND_COLORS = ["#50F0E6", "#50CCAA", "#F0E641", "#FF5050", "#960032", "#7D2181"] as const
const EEA_BAND_LABELS = ["Very Good", "Good", "Moderate", "Poor", "Bad", "Very Bad"] as const

function eeaRanges(
	maxes: readonly [number, number, number, number, number]
): AirQualityRange[] {
	return [
		{ max: maxes[0], color: EEA_BAND_COLORS[0], label: EEA_BAND_LABELS[0] },
		{ max: maxes[1], color: EEA_BAND_COLORS[1], label: EEA_BAND_LABELS[1] },
		{ max: maxes[2], color: EEA_BAND_COLORS[2], label: EEA_BAND_LABELS[2] },
		{ max: maxes[3], color: EEA_BAND_COLORS[3], label: EEA_BAND_LABELS[3] },
		{ max: maxes[4], color: EEA_BAND_COLORS[4], label: EEA_BAND_LABELS[4] },
		{ max: Infinity, color: EEA_BAND_COLORS[5], label: "Hazardous" }
	]
}

export const AIR_QUALITY_SCALES = {
	PM1: {
		label: "PM1",
		unit: "µg/m³",
		ranges: eeaRanges([5, 10, 20, 35, 50])
	},

	PM25: {
		label: "PM2.5",
		unit: "µg/m³",
		ranges: eeaRanges([10, 20, 25, 50, 75])
	},

	PM10: {
		label: "PM10",
		unit: "µg/m³",
		ranges: eeaRanges([20, 40, 50, 100, 150])
	},

	NO2: {
		label: "NO₂",
		unit: "µg/m³",
		ranges: eeaRanges([40, 90, 120, 230, 340])
	},

	NO: {
		label: "NO",
		unit: "µg/m³",
		ranges: eeaRanges([20, 40, 80, 150, 250])
	},

	CO: {
		label: "CO",
		unit: "µg/m³",
		ranges: eeaRanges([1000, 5000, 10000, 17000, 34000])
	},

	O3: {
		label: "O₃",
		unit: "µg/m³",
		ranges: eeaRanges([50, 100, 130, 240, 380])
	},

	SO2: {
		label: "SO₂",
		unit: "µg/m³",
		ranges: eeaRanges([100, 200, 350, 500, 750])
	},

	CAQI: {
		label: "CAQI",
		unit: "index",
		ranges: [
			{ max: 25, color: "#50F0E6", label: "Very Low" },
			{ max: 50, color: "#50CCAA", label: "Low" },
			{ max: 75, color: "#F0E641", label: "Medium" },
			{ max: 100, color: "#FF5050", label: "High" },
			{ max: Infinity, color: "#960032", label: "Very High" }
		]
	}
} as const

export type AirQualityScaleKey = keyof typeof AIR_QUALITY_SCALES

function rangeLabelToStopKey(label: string): string {
	return label
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/₂/g, "2")
}

export function airQualityScaleToValueColorScale(scaleKey: AirQualityScaleKey): ValueColorScale {
	const def = AIR_QUALITY_SCALES[scaleKey]
	const stops: ValueScaleStop[] = def.ranges.map((r) => ({
		until: r.max === Infinity ? Number.POSITIVE_INFINITY : r.max,
		color: r.color,
		key: rangeLabelToStopKey(r.label)
	}))

	return {
		id: scaleKey.toLowerCase(),
		unitLabel: def.unit,
		stops
	}
}

/** Klucze metryk z API / selecta → wpis w {@link AIR_QUALITY_SCALES}. */
export const METRIC_KEY_TO_AIR_QUALITY_SCALE: Partial<Record<string, AirQualityScaleKey>> = {
	pm1: "PM1",
	pm25: "PM25",
	pm10: "PM10",
	no2: "NO2",
	no: "NO",
	co: "CO",
	o3: "O3",
	so2: "SO2",
	caqi: "CAQI"
}
