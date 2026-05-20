import { DISTRICT_FILES } from "@/constants/districts"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { GeoJsonObject } from "geojson"
import { NextResponse } from "next/server"

const CACHE_SECONDS = 86_400

type DistrictPayload = { data: GeoJsonObject; name: string }

let cachedDistricts: DistrictPayload[] | null = null

async function loadDistricts(): Promise<DistrictPayload[]> {
	if (cachedDistricts) {
		return cachedDistricts
	}

	const districts = await Promise.all(
		DISTRICT_FILES.map(async ({ path: publicPath, name }) => {
			const filePath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""))
			const raw = await readFile(filePath, "utf-8")
			return { data: JSON.parse(raw) as GeoJsonObject, name }
		})
	)

	cachedDistricts = districts
	return districts
}

export async function GET() {
	const districts = await loadDistricts()

	return NextResponse.json(districts, {
		headers: {
			"Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=604800`
		}
	})
}
