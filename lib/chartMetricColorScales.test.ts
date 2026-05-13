import { describe, expect, it } from "vitest"

import {
	CAQI_VALUE_SCALE,
	colorAtConcentration,
	NO2_VALUE_SCALE,
	PM10_VALUE_SCALE,
	PM25_VALUE_SCALE,
	valueScaleLegendTicks
} from "@/lib/chartMetricColorScales"

describe("colorAtConcentration (PM10)", () => {
	it("returns solid green in the first band", () => {
		const c = colorAtConcentration(PM10_VALUE_SCALE, 10)
		expect(c).toBe("rgb(0,228,0)")
	})

	it("interpolates between two thresholds", () => {
		const low = colorAtConcentration(PM10_VALUE_SCALE, 20)
		const mid = colorAtConcentration(PM10_VALUE_SCALE, 27.5)
		const high = colorAtConcentration(PM10_VALUE_SCALE, 35)
		expect(low).not.toBe(high)
		expect(mid).not.toBe(low)
		expect(mid).not.toBe(high)
	})

	it("uses hazardous above last finite threshold", () => {
		const c = colorAtConcentration(PM10_VALUE_SCALE, 400)
		expect(c).toBe("rgb(126,0,35)")
	})

	it("legend ticks align to scale max", () => {
		const ticks = valueScaleLegendTicks(PM10_VALUE_SCALE)
		expect(ticks[0]).toEqual({ value: 0, positionPct: 0 })
		expect(ticks.at(-1)).toEqual({ value: 200, positionPct: 100 })
	})
})

describe("colorAtConcentration (CAQI)", () => {
	it("uses hazardous band above last finite threshold", () => {
		const c = colorAtConcentration(CAQI_VALUE_SCALE, 200)
		expect(c).toBe("rgb(126,0,35)")
	})

	it("legend max matches CAQI finite cap", () => {
		const ticks = valueScaleLegendTicks(CAQI_VALUE_SCALE)
		expect(ticks.at(-1)).toEqual({ value: 150, positionPct: 100 })
	})
})

describe("colorAtConcentration (PM2.5)", () => {
	it("uses hazardous above last finite threshold", () => {
		const c = colorAtConcentration(PM25_VALUE_SCALE, 300)
		expect(c).toBe("rgb(126,0,35)")
	})

	it("legend max matches PM2.5 finite cap", () => {
		const ticks = valueScaleLegendTicks(PM25_VALUE_SCALE)
		expect(ticks.at(-1)).toEqual({ value: 100, positionPct: 100 })
	})
})

describe("colorAtConcentration (NO2)", () => {
	it("uses hazardous band above last finite threshold", () => {
		const c = colorAtConcentration(NO2_VALUE_SCALE, 900)
		expect(c).toBe("rgb(126,0,35)")
	})

	it("legend max matches NO2 finite cap", () => {
		const ticks = valueScaleLegendTicks(NO2_VALUE_SCALE)
		expect(ticks.at(-1)).toEqual({ value: 800, positionPct: 100 })
	})
})
