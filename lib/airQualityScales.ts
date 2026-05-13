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

export const AIR_QUALITY_SCALES = {
	PM25: {
		label: "PM2.5",
		unit: "µg/m³",
		ranges: [
			{ max: 10, color: "#00E400", label: "Very Good" },
			{ max: 20, color: "#A3E635", label: "Good" },
			{ max: 25, color: "#FFD600", label: "Moderate" },
			{ max: 50, color: "#FF7E00", label: "Poor" },
			{ max: 75, color: "#FF0000", label: "Bad" },
			{ max: 100, color: "#8F3F97", label: "Very Bad" },
			{ max: Infinity, color: "#7E0023", label: "Hazardous" }
		]
	},

	PM10: {
		label: "PM10",
		unit: "µg/m³",
		ranges: [
			{ max: 20, color: "#00E400", label: "Very Good" },
			{ max: 35, color: "#A3E635", label: "Good" },
			{ max: 50, color: "#FFD600", label: "Moderate" },
			{ max: 100, color: "#FF7E00", label: "Poor" },
			{ max: 150, color: "#FF0000", label: "Bad" },
			{ max: 200, color: "#8F3F97", label: "Very Bad" },
			{ max: Infinity, color: "#7E0023", label: "Hazardous" }
		]
	},

	NO2: {
		label: "NO₂",
		unit: "µg/m³",
		ranges: [
			{ max: 50, color: "#00E400", label: "Very Good" },
			{ max: 100, color: "#A3E635", label: "Good" },
			{ max: 200, color: "#FFD600", label: "Moderate" },
			{ max: 400, color: "#FF7E00", label: "Poor" },
			{ max: 600, color: "#FF0000", label: "Bad" },
			{ max: 800, color: "#8F3F97", label: "Very Bad" },
			{ max: Infinity, color: "#7E0023", label: "Hazardous" }
		]
	},

	CO: {
		label: "CO",
		unit: "mg/m³",
		ranges: [
			{ max: 2, color: "#00E400", label: "Very Good" },
			{ max: 4, color: "#A3E635", label: "Good" },
			{ max: 7, color: "#FFD600", label: "Moderate" },
			{ max: 10, color: "#FF7E00", label: "Poor" },
			{ max: 15, color: "#FF0000", label: "Bad" },
			{ max: 20, color: "#8F3F97", label: "Very Bad" },
			{ max: Infinity, color: "#7E0023", label: "Hazardous" }
		]
	},

	CAQI: {
		label: "CAQI",
		unit: "%",
		ranges: [
			{ max: 25, color: "#00E400", label: "Very Low" },
			{ max: 50, color: "#A3E635", label: "Low" },
			{ max: 75, color: "#FFD600", label: "Medium" },
			{ max: 100, color: "#FF7E00", label: "High" },
			{ max: 125, color: "#FF0000", label: "Very High" },
			{ max: 150, color: "#8F3F97", label: "Extreme" },
			{ max: Infinity, color: "#7E0023", label: "Hazardous" }
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
	pm25: "PM25",
	pm10: "PM10",
	no2: "NO2",
	co: "CO",
	caqi: "CAQI"
}
