import { describe, expect, it, vi } from "vitest"

import { fetchModelPredictionPoints } from "@/lib/modelPrediction"

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
