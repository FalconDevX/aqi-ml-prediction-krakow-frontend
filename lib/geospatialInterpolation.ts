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
	opacity = 0.5
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
		const lat = bounds.north - (y / height) * latSpan
		for (let x = 0; x < width; x += 1) {
			const lng = bounds.west + (x / width) * lngSpan
			const value = idwInterpolate(lat, lng, samples)
			const offset = (y * width + x) * 4

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
	return canvas
}
