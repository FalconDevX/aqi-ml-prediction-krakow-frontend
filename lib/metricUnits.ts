import { AIR_QUALITY_SCALES, METRIC_KEY_TO_AIR_QUALITY_SCALE } from "@/lib/airQualityScales"

const EXTRA_UNITS: Record<string, string> = {
	temperature: "°C",
	humidity: "%",
	pressure: "hPa"
}

/** Jednostka dla klucza metryki z API (np. pm25, temperature). */
export function getMetricUnit(metricKey: string): string | undefined {
	const key = metricKey.toLowerCase()
	const scaleKey = METRIC_KEY_TO_AIR_QUALITY_SCALE[key]
	if (scaleKey) {
		return AIR_QUALITY_SCALES[scaleKey].unit
	}
	return EXTRA_UNITS[key]
}
