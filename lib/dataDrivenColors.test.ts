import { describe, expect, it } from "vitest"

import {
	colorAtDataValue,
	metricDataRangeFromStations
} from "@/lib/dataDrivenColors"

describe("colorAtDataValue", () => {
	it("maps min to darkest and max to lightest", () => {
		const dataMin = 10
		const dataMax = 40
		const atMin = colorAtDataValue(dataMin, dataMin, dataMax)
		const atMax = colorAtDataValue(dataMax, dataMin, dataMax)
		expect(atMin).toBe("rgb(18,22,58)")
		expect(atMax).toBe("rgb(255,238,110)")
		expect(atMin).not.toBe(atMax)
	})

	it("interpolates between endpoints", () => {
		const mid = colorAtDataValue(25, 10, 40)
		expect(mid).not.toBe(colorAtDataValue(10, 10, 40))
		expect(mid).not.toBe(colorAtDataValue(40, 10, 40))
	})
})

describe("metricDataRangeFromStations", () => {
	it("returns min and max from station measurements", () => {
		const range = metricDataRangeFromStations(
			[{ id: 1 }, { id: 2 }],
			{
				1: { values: { pm25: 18 } },
				2: { values: { pm25: 32 } }
			},
			"pm25"
		)
		expect(range).toEqual({ min: 18, max: 32 })
	})
})
