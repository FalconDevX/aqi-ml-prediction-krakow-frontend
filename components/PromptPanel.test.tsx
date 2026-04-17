import { describe, it, expect } from "vitest"
import { detectPlotQuery } from "./PromptPanel"

describe("detectPlotQuery", () => {
	it("wykrywa zapytanie o działki w Zwierzyńcu", () => {
		expect(detectPlotQuery("szukam działki w Zwierzyńcu w Krakowie")).toBe(true)
	})

	it("działa niezależnie od wielkości liter", () => {
		expect(detectPlotQuery("DZIAŁKA ZWIERZYNIEC")).toBe(true)
	})

	it("akceptuje warianty słowa 'działka' bez polskich znaków", () => {
		expect(detectPlotQuery("dzialki zwierzyniec")).toBe(true)
	})

	it("akceptuje angielskie słowa 'plot' i 'parcel'", () => {
		expect(detectPlotQuery("looking for a plot in Zwierzyniec")).toBe(true)
		expect(detectPlotQuery("parcel in zwierzyniec")).toBe(true)
	})

	it("zwraca false gdy brakuje lokalizacji", () => {
		expect(detectPlotQuery("szukam działki w Nowej Hucie")).toBe(false)
	})

	it("zwraca false gdy brakuje słowa kluczowego o działce", () => {
		expect(detectPlotQuery("pogoda w Zwierzyńcu")).toBe(false)
	})

	it("zwraca false dla pustego stringa", () => {
		expect(detectPlotQuery("")).toBe(false)
	})
})
