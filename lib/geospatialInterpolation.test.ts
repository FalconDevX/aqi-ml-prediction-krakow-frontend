import { describe, expect, it } from "vitest"
import { idwInterpolate } from "@/lib/geospatialInterpolation"

describe("idwInterpolate", () => {
	it("returns exact value at sample location", () => {
		const value = idwInterpolate(50.06, 19.94, [{ lat: 50.06, lng: 19.94, value: 42 }])
		expect(value).toBe(42)
	})

	it("interpolates between two samples", () => {
		const value = idwInterpolate(50.06, 19.94, [
			{ lat: 50.05, lng: 19.93, value: 10 },
			{ lat: 50.07, lng: 19.95, value: 30 }
		])
		expect(value).not.toBeNull()
		expect(value!).toBeGreaterThan(10)
		expect(value!).toBeLessThan(30)
	})
})
