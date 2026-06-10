import { describe, expect, it } from "vitest"
import {
	boundingBoxFromPolygons,
	gridDimensionsForBounds,
	idwInterpolate,
	isPointInAnyPolygon,
	type PolygonWithHoles
} from "@/lib/geospatialInterpolation"

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

describe("krakow polygon clipping", () => {
	const square: PolygonWithHoles[] = [
		[
			[
				[19.9, 50.0],
				[20.0, 50.0],
				[20.0, 50.1],
				[19.9, 50.1],
				[19.9, 50.0]
			]
		]
	]

	it("detects points inside and outside a polygon", () => {
		expect(isPointInAnyPolygon(19.95, 50.05, square)).toBe(true)
		expect(isPointInAnyPolygon(19.85, 50.05, square)).toBe(false)
	})

	it("computes bounding box from polygons", () => {
		expect(boundingBoxFromPolygons(square)).toEqual({
			south: 50.0,
			west: 19.9,
			north: 50.1,
			east: 20.0
		})
	})

	it("keeps grid aspect ratio close to geographic bounds", () => {
		const krakowLikeBounds = {
			south: 49.97,
			west: 19.79,
			north: 50.13,
			east: 20.22
		}
		const grid = gridDimensionsForBounds(krakowLikeBounds, 360)
		expect(grid.width).toBeGreaterThan(grid.height)
		expect(grid.width).toBe(360)
	})
})
