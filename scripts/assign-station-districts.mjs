import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const DISTRICT_FILES = [
	{ file: "bienczyce.geojson", name: "Bienczyce" },
	{ file: "biezanow_prokocim.geojson", name: "Bieżanów-Prokocim" },
	{ file: "bronowice.geojson", name: "Bronowice" },
	{ file: "czyzyny.geojson", name: "Czyżyny" },
	{ file: "debniki.geojson", name: "Dębniki" },
	{ file: "grzegorzki.geojson", name: "Grzegórzki" },
	{ file: "krowodrza.geojson", name: "Krowodrza" },
	{ file: "lagiewniki_borek_falecki.geojson", name: "Łagiewniki-Borek Falecki" },
	{ file: "mistrzejowice.geojson", name: "Mistrzejowice" },
	{ file: "nowa_huta.geojson", name: "Nowa Huta" },
	{ file: "podgorze_duchackie.geojson", name: "Podgórze Duchackie" },
	{ file: "podgorze.geojson", name: "Podgórze" },
	{ file: "prądnik_biały.geojson", name: "Prądnik Biały" },
	{ file: "pradnik_czerwony.geojson", name: "Prądnik Czerwony" },
	{ file: "stare_miasto.geojson", name: "Stare Miasto" },
	{ file: "swoszowice.geojson", name: "Swoszowice" },
	{ file: "wzgorza_krzeszlawickie.geojson", name: "Wzgórza Krzesławickie" },
	{ file: "zwierzyniec.geojson", name: "Zwierzyniec" }
]

function pointInRing([x, y], ring) {
	let inside = false
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i]
		const [xj, yj] = ring[j]
		const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
		if (intersects) {
			inside = !inside
		}
	}
	return inside
}

function pointInPolygonCoords([lng, lat], coordinates, type) {
	if (type === "Polygon") {
		const [outer, ...holes] = coordinates
		if (!pointInRing([lng, lat], outer)) {
			return false
		}
		return !holes.some((hole) => pointInRing([lng, lat], hole))
	}

	if (type === "MultiPolygon") {
		return coordinates.some((polygon) => {
			const [outer, ...holes] = polygon
			if (!pointInRing([lng, lat], outer)) {
				return false
			}
			return !holes.some((hole) => pointInRing([lng, lat], hole))
		})
	}

	return false
}

function pointInFeature([lng, lat], feature) {
	return pointInPolygonCoords([lng, lat], feature.geometry.coordinates, feature.geometry.type)
}

function findDistrict(lng, lat, districts) {
	for (const district of districts) {
		if (pointInFeature([lng, lat], district.feature)) {
			return district.name
		}
	}
	return null
}

const stations = JSON.parse(await readFile(path.join(root, "public/stations.json"), "utf-8"))

const districts = await Promise.all(
	DISTRICT_FILES.map(async ({ file, name }) => {
		const raw = await readFile(path.join(root, "public/geojson", file), "utf-8")
		return { name, feature: JSON.parse(raw) }
	})
)

const districtByStationId = {}
const unmatched = []

for (const station of stations) {
	const district = findDistrict(station.long, station.lat, districts)
	if (district) {
		districtByStationId[String(station.id)] = district
	} else {
		unmatched.push(station)
		districtByStationId[String(station.id)] = "Kraków"
	}
}

await writeFile(
	path.join(root, "lib/stationDistricts.json"),
	`${JSON.stringify(districtByStationId, null, 2)}\n`,
	"utf-8"
)

console.log(`Assigned districts for ${stations.length - unmatched.length}/${stations.length} stations`)
if (unmatched.length > 0) {
	console.log("Unmatched:", unmatched.map((s) => `${s.id} ${s.name}`).join(", "))
}
