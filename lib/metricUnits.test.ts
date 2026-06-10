import { describe, expect, it } from "vitest"
import { getMetricUnit } from "@/lib/metricUnits"

describe("getMetricUnit", () => {
	it("returns EEA unit for pollutants", () => {
		expect(getMetricUnit("pm25")).toBe("µg/m³")
		expect(getMetricUnit("PM25")).toBe("µg/m³")
		expect(getMetricUnit("caqi")).toBe("index")
	})

	it("returns units for environmental metrics", () => {
		expect(getMetricUnit("temperature")).toBe("°C")
		expect(getMetricUnit("humidity")).toBe("%")
		expect(getMetricUnit("pressure")).toBe("hPa")
	})

	it("returns undefined for unknown keys", () => {
		expect(getMetricUnit("unknown_metric")).toBeUndefined()
	})
})
