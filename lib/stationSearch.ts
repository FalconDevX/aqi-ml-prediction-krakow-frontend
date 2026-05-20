import Fuse, { type IFuseOptions } from "fuse.js"
import type { StationRecord } from "@/lib/stations"

const FUSE_OPTIONS: IFuseOptions<StationRecord> = {
	keys: [
		{ name: "name", weight: 0.6 },
		{ name: "district", weight: 0.2 },
		{ name: "idStr", weight: 0.2 }
	],
	threshold: 0.3,
	includeScore: true,
	ignoreLocation: true,
	minMatchCharLength: 2
}

export function createStationFuse(stations: StationRecord[]): Fuse<StationRecord> {
	return new Fuse(stations, FUSE_OPTIONS)
}

export function searchStations(fuse: Fuse<StationRecord>, query: string): StationRecord[] {
	const trimmed = query.trim()
	if (!trimmed) {
		return []
	}
	return fuse.search(trimmed).map((result) => result.item)
}

/** Zwraca `null`, gdy puste zapytanie — wtedy mapa pokazuje wszystkie stacje. */
export function getFilteredStationIds(
	stations: StationRecord[],
	query: string
): Set<number> | null {
	const trimmed = query.trim()
	if (!trimmed) {
		return null
	}

	const fuse = createStationFuse(stations)
	const results = searchStations(fuse, trimmed)
	return new Set(results.map((station) => station.id))
}
