import { describe, expect, it } from "vitest"
import {
	buildWhitespaceTimeScaleSeries,
	connectPredictionToLastMeasurement,
	estimateSeriesStepMs,
	gapThresholdMs,
	measurementPointsToChartSeries,
	sortMeasurementPoints,
	splitMeasurementPointsByGaps
} from "@/lib/measurementChartSeries"

describe("measurementChartSeries", () => {
	it("sorts points chronologically", () => {
		const sorted = sortMeasurementPoints([
			{ timestamp: "2026-06-10T12:00:00Z", value: 2 },
			{ timestamp: "2026-05-29T10:00:00Z", value: 1 }
		])
		expect(sorted[0]?.timestamp).toContain("2026-05-29")
	})

	it("inserts whitespace when gap exceeds threshold", () => {
		const series = measurementPointsToChartSeries([
			{ timestamp: "2026-05-29T10:00:00Z", value: 11 },
			{ timestamp: "2026-06-10T12:00:00Z", value: 12 }
		])

		expect(series).toHaveLength(3)
		expect("value" in series[0]!).toBe(true)
		expect("value" in series[1]!).toBe(false)
		expect("value" in series[2]!).toBe(true)
	})

	it("anchors prediction series at the last measurement", () => {
		const connected = connectPredictionToLastMeasurement(
			[
				{ timestamp: "2026-06-01T10:00:00Z", value: 11 },
				{ timestamp: "2026-06-01T12:00:00Z", value: 12 }
			],
			[
				{ timestamp: "2026-06-01T11:00:00Z", value: 99 },
				{ timestamp: "2026-06-02T08:00:00Z", value: 14 }
			]
		)

		expect(connected).toEqual([
			{ timestamp: "2026-06-01T12:00:00Z", value: 12 },
			{ timestamp: "2026-06-02T08:00:00Z", value: 14 }
		])
	})

	it("splits points into separate segments at large gaps", () => {
		const segments = splitMeasurementPointsByGaps([
			{ timestamp: "2026-05-29T10:00:00Z", value: 11 },
			{ timestamp: "2026-05-29T11:00:00Z", value: 12 },
			{ timestamp: "2026-06-10T12:00:00Z", value: 13 }
		])

		expect(segments).toHaveLength(2)
		expect(segments[0]).toHaveLength(2)
		expect(segments[1]).toHaveLength(1)
	})

	it("connects across gaps when breakGaps is disabled", () => {
		const series = measurementPointsToChartSeries(
			[
				{ timestamp: "2026-05-29T10:00:00Z", value: 11 },
				{ timestamp: "2026-06-10T12:00:00Z", value: 12 }
			],
			undefined,
			{ breakGaps: false }
		)

		expect(series).toHaveLength(2)
		expect(series.every((point) => "value" in point)).toBe(true)
	})

	it("keeps contiguous hourly points connected", () => {
		const series = measurementPointsToChartSeries([
			{ timestamp: "2026-05-29T10:00:00Z", value: 11 },
			{ timestamp: "2026-05-29T11:00:00Z", value: 12 },
			{ timestamp: "2026-05-29T12:00:00Z", value: 13 }
		])

		expect(series.every((point) => "value" in point)).toBe(true)
	})

	it("builds dense whitespace scale between first and last point", () => {
		const scale = buildWhitespaceTimeScaleSeries([
			{ timestamp: "2026-05-29T10:00:00Z", value: 1 },
			{ timestamp: "2026-05-29T13:00:00Z", value: 2 }
		])

		expect(scale.length).toBeGreaterThan(2)
		expect(scale[0]?.time).toBe(Math.floor(Date.parse("2026-05-29T10:00:00Z") / 1000))
	})

	it("estimates hourly cadence and gap threshold", () => {
		const points = [
			{ timestamp: "2026-05-29T10:00:00Z", value: 1 },
			{ timestamp: "2026-05-29T11:00:00Z", value: 2 },
			{ timestamp: "2026-05-29T12:00:00Z", value: 3 }
		]
		const step = estimateSeriesStepMs(points)
		expect(step).toBe(3_600_000)
		expect(gapThresholdMs(step)).toBeGreaterThan(step)
	})
})
