import stationsJson from "@/public/stations.json"
import districtByStationIdJson from "@/lib/stationDistricts.json"

const districtByStationId = districtByStationIdJson as Record<string, string>

export type StationRecord = {
	id: number
	name: string
	lat: number
	long: number
	district: string
	idStr: string
	color: string
}

const DEFAULT_COLOR = "#84cc16"

export const STATIONS: StationRecord[] = stationsJson.map((station) => ({
	...station,
	district: districtByStationId[String(station.id)] ?? "Kraków",
	idStr: String(station.id),
	color: DEFAULT_COLOR
}))
