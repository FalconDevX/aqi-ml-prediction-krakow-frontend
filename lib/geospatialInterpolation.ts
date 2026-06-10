import type {
	Feature,
	FeatureCollection,
	GeoJsonObject,
	Geometry,
	MultiPolygon,
	Polygon
} from "geojson"

export type GeoSample = {
	lat: number
	lng: number
	value: number
}

export type GeoBounds = {
	south: number
	west: number
	north: number
	east: number
}

export type LngLat = [number, number]
export type PolygonWithHoles = LngLat[][]

const MIN_DISTANCE_DEG = 1e-7

export function idwInterpolate( lat: number, lng: number, samples: GeoSample[], power = 2 ): number | null {
	if (samples.length === 0) {
		return null
	}

	let weightSum = 0
	let valueSum = 0

	for (const sample of samples) {
		const dLat = lat - sample.lat
		const dLng = lng - sample.lng
		const distance = Math.sqrt(dLat * dLat + dLng * dLng)

		if (distance < MIN_DISTANCE_DEG) {
			return sample.value
		}

		const weight = 1 / distance ** power
		weightSum += weight
		valueSum += weight * sample.value
	}

	return weightSum > 0 ? valueSum / weightSum : null
}

function geometryToPolygons(geometry: Geometry): PolygonWithHoles[] {
	if (geometry.type === "Polygon") {
		return [geometry.coordinates as PolygonWithHoles]
	}
	if (geometry.type === "MultiPolygon") {
		return geometry.coordinates as PolygonWithHoles[]
	}
	return []
}

export function extractPolygonsFromGeoJson(geo: GeoJsonObject): PolygonWithHoles[] {
	if (geo.type === "Feature") {
		const feature = geo as Feature
		return feature.geometry ? geometryToPolygons(feature.geometry) : []
	}
	if (geo.type === "FeatureCollection") {
		return (geo as FeatureCollection).features.flatMap((feature) =>
			feature.geometry ? geometryToPolygons(feature.geometry) : []
		)
	}
	if (geo.type === "Polygon" || geo.type === "MultiPolygon") {
		return geometryToPolygons(geo as Polygon | MultiPolygon)
	}
	return []
}

function pointInRing(lng: number, lat: number, ring: LngLat[]): boolean {
	let inside = false
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
		const [xi, yi] = ring[i]
		const [xj, yj] = ring[j]
		const intersects =
			yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
		if (intersects) {
			inside = !inside
		}
	}
	return inside
}

export function isPointInPolygonWithHoles(
	lng: number,
	lat: number,
	polygon: PolygonWithHoles
): boolean {
	const [exterior, ...holes] = polygon
	if (!exterior || !pointInRing(lng, lat, exterior)) {
		return false
	}
	return !holes.some((hole) => pointInRing(lng, lat, hole))
}

export function isPointInAnyPolygon(
	lng: number,
	lat: number,
	polygons: PolygonWithHoles[]
): boolean {
	return polygons.some((polygon) => isPointInPolygonWithHoles(lng, lat, polygon))
}

export function boundingBoxFromPolygons(polygons: PolygonWithHoles[]): GeoBounds | null {
	if (polygons.length === 0) {
		return null
	}

	let south = Number.POSITIVE_INFINITY
	let west = Number.POSITIVE_INFINITY
	let north = Number.NEGATIVE_INFINITY
	let east = Number.NEGATIVE_INFINITY

	for (const polygon of polygons) {
		for (const ring of polygon) {
			for (const [lng, lat] of ring) {
				south = Math.min(south, lat)
				west = Math.min(west, lng)
				north = Math.max(north, lat)
				east = Math.max(east, lng)
			}
		}
	}

	if (!Number.isFinite(south)) {
		return null
	}

	return { south, west, north, east }
}

export function gridDimensionsForBounds(
	bounds: GeoBounds,
	targetLongSide = 360
): { width: number; height: number } {
	const latSpan = bounds.north - bounds.south
	const lngSpan = bounds.east - bounds.west
	if (latSpan <= 0 || lngSpan <= 0) {
		return { width: targetLongSide, height: targetLongSide }
	}

	const midLatRad = (((bounds.north + bounds.south) / 2) * Math.PI) / 180
	const latMeters = latSpan * 111_320
	const lngMeters = lngSpan * 111_320 * Math.cos(midLatRad)
	const aspect = lngMeters / latMeters

	if (aspect >= 1) {
		return { width: targetLongSide, height: Math.max(1, Math.round(targetLongSide / aspect)) }
	}

	return { width: Math.max(1, Math.round(targetLongSide * aspect)), height: targetLongSide }
}

function geoToCanvasPoint(
	lng: number,
	lat: number,
	bounds: GeoBounds,
	width: number,
	height: number
): [number, number] {
	const lngSpan = bounds.east - bounds.west
	const latSpan = bounds.north - bounds.south
	const x = ((lng - bounds.west) / lngSpan) * width
	const y = ((bounds.north - lat) / latSpan) * height
	return [x, y]
}

function buildClipPath(
	bounds: GeoBounds,
	width: number,
	height: number,
	polygons: PolygonWithHoles[]
): Path2D {
	const path = new Path2D()

	for (const polygon of polygons) {
		for (const ring of polygon) {
			ring.forEach(([lng, lat], index) => {
				const [x, y] = geoToCanvasPoint(lng, lat, bounds, width, height)
				if (index === 0) {
					path.moveTo(x, y)
				} else {
					path.lineTo(x, y)
				}
			})
			path.closePath()
		}
	}

	return path
}

function applyPolygonMaskToCanvas(
	ctx: CanvasRenderingContext2D,
	bounds: GeoBounds,
	width: number,
	height: number,
	polygons: PolygonWithHoles[]
): void {
	ctx.globalCompositeOperation = "destination-in"
	ctx.fillStyle = "#ffffff"
	ctx.fill(buildClipPath(bounds, width, height, polygons), "evenodd")
	ctx.globalCompositeOperation = "source-over"
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
	const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/)
	if (!match) {
		return null
	}
	return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) }
}

export function renderIdwHeatmapCanvas(
	bounds: GeoBounds,
	width: number,
	height: number,
	samples: GeoSample[],
	colorForValue: (value: number) => string,
	opacity = 0.5,
	clipPolygons?: PolygonWithHoles[]
): HTMLCanvasElement | null {
	if (samples.length < 2 || width <= 0 || height <= 0) {
		return null
	}

	const canvas = document.createElement("canvas")
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext("2d")
	if (!ctx) {
		return null
	}

	const imageData = ctx.createImageData(width, height)
	const latSpan = bounds.north - bounds.south
	const lngSpan = bounds.east - bounds.west
	const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255)

	for (let y = 0; y < height; y += 1) {
		const lat = bounds.north - ((y + 0.5) / height) * latSpan
		for (let x = 0; x < width; x += 1) {
			const lng = bounds.west + ((x + 0.5) / width) * lngSpan
			const offset = (y * width + x) * 4
			const value = idwInterpolate(lat, lng, samples)
			if (value === null) {
				imageData.data[offset + 3] = 0
				continue
			}

			const rgb = parseRgb(colorForValue(value))
			if (!rgb) {
				imageData.data[offset + 3] = 0
				continue
			}

			imageData.data[offset] = rgb.r
			imageData.data[offset + 1] = rgb.g
			imageData.data[offset + 2] = rgb.b
			imageData.data[offset + 3] = alpha
		}
	}

	ctx.putImageData(imageData, 0, 0)

	if (clipPolygons && clipPolygons.length > 0) {
		applyPolygonMaskToCanvas(ctx, bounds, width, height, clipPolygons)
	}

	return canvas
}
