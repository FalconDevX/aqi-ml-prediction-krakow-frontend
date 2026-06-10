import { describe, expect, it, vi } from "vitest"

import {
	fetchModelPredictionPoints,
	resolvePredictionHours
} from "@/lib/modelPrediction"

describe("resolvePredictionHours", () => {
	it("uses preset when custom input is empty", () => {
		expect(resolvePredictionHours(10, "")).toEqual({ hours: 10 })
	})

	it("uses custom value when provided", () => {
		expect(resolvePredictionHours(10, "7")).toEqual({ hours: 7 })
	})

	it("rejects out of range custom values", () => {
		expect(resolvePredictionHours(10, "20")).toEqual({
			error: "Horyzont musi być od 1 do 15 h."
		})
	})
})

describe("fetchModelPredictionPoints request", () => {
	it("appends hours query parameter", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => []
		})
		vi.stubGlobal("fetch", fetchMock)

		await fetchModelPredictionPoints("17", "pm25", 5)

		expect(fetchMock).toHaveBeenCalledWith("/api/model/prediction/pm25/17?hours=5")
		vi.unstubAllGlobals()
	})
})

describe("fetchModelPredictionPoints API errors", () => {
	it("surfaces FastAPI detail string from 400 body", async () => {
		const detail = "Not enough data: need 48 records, got 46"
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				text: async () => JSON.stringify({ detail })
			})
		)
		await expect(fetchModelPredictionPoints("64980", "o3")).rejects.toThrow(detail)
		vi.unstubAllGlobals()
	})

	it("surfaces FastAPI detail array with msg fields", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 422,
				text: async () =>
					JSON.stringify({
						detail: [{ msg: "field required" }, { msg: "invalid type" }]
					})
			})
		)
		await expect(fetchModelPredictionPoints("1", "pm25")).rejects.toThrow("field required invalid type")
		vi.unstubAllGlobals()
	})
})
