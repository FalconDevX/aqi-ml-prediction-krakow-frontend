"use client"

import { useEffect, useRef, useState } from "react"
import { Polygon, useMap } from "react-leaflet"
import type { LatLngTuple } from "leaflet"
import L from "leaflet"

const PLOT_FILES = ["/geojson/plot1.geojson", "/geojson/plot2.geojson"]

const STYLE = {
	color: "#a3e635",
	fillColor: "#84cc16",
	fillOpacity: 0.35,
	weight: 2,
	dashArray: "4 4"
} as const

type GeoJsonLike = {
	features: Array<{
		geometry: {
			coordinates: [number, number][]
		}
	}>
}

type Props = {
	visible: boolean
}

export default function PlotsLayer({ visible }: Props) {
	const map = useMap()
	const [plots, setPlots] = useState<LatLngTuple[][]>([])
	const previousCenter = useRef<{ center: L.LatLng; zoom: number } | null>(null)

	useEffect(() => {
		if (!visible) {
			return
		}

		let cancelled = false
		Promise.all(
			PLOT_FILES.map(async (url) => {
				const res = await fetch(url)
				if (!res.ok) {
					throw new Error(`Missing plot geojson: ${url}`)
				}
				return res.json() as Promise<GeoJsonLike>
			})
		)
			.then((jsons) => {
				if (cancelled) {
					return
				}
				const polys = jsons.map((j) => {
					const coords = j.features[0].geometry.coordinates
					return coords.map(([lng, lat]) => [lat, lng] as LatLngTuple)
				})
				setPlots(polys)
			})
			.catch(() => {
				if (!cancelled) {
					setPlots([])
				}
			})
		return () => {
			cancelled = true
		}
	}, [visible])

	useEffect(() => {
		if (!visible || plots.length === 0) {
			return
		}

		if (!previousCenter.current) {
			previousCenter.current = { center: map.getCenter(), zoom: map.getZoom() }
		}

		const bounds = L.latLngBounds(plots.flat())
		map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 17, duration: 1.2 })
	}, [visible, plots, map])

	if (!visible) {
		return null
	}

	return (
		<>
			{plots.map((positions, i) => (
				<Polygon key={i} positions={positions} pathOptions={STYLE} />
			))}
		</>
	)
}
