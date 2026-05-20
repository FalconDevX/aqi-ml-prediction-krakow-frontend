import { describe, expect, it } from "vitest"
import { STATIONS } from "@/lib/stations"
import { createStationFuse, getFilteredStationIds, searchStations } from "@/lib/stationSearch"

describe("stationSearch", () => {
	it("zwraca null dla pustego zapytania (wszystkie stacje)", () => {
		expect(getFilteredStationIds(STATIONS, "")).toBeNull()
		expect(getFilteredStationIds(STATIONS, "   ")).toBeNull()
	})

	it("znajduje stację po fragmencie nazwy", () => {
		const fuse = createStationFuse(STATIONS)
		const results = searchStations(fuse, "Rynek")
		expect(results.some((s) => s.name === "Rynek Główny")).toBe(true)
	})

	it("znajduje stację po ID", () => {
		const fuse = createStationFuse(STATIONS)
		const results = searchStations(fuse, "65989")
		expect(results.some((s) => s.id === 65989)).toBe(true)
	})

	it("getFilteredStationIds zawęża wyniki", () => {
		const ids = getFilteredStationIds(STATIONS, "Dietla")
		expect(ids).not.toBeNull()
		expect(ids!.has(58)).toBe(true)
		expect(ids!.size).toBeLessThan(STATIONS.length)
	})
})
