"use client"

import { colorAtConcentration, getValueColorScaleForMetric } from "@/lib/chartMetricColorScales"
import type { StationMeasurementsMap } from "@/hooks/useStationMeasurements"
import { renderIdwHeatmapCanvas, type GeoSample } from "@/lib/geospatialInterpolation"
import L from "leaflet"
import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import type { MetricOption } from "./MapOptionsPanel"

type Station = {
	id: number
	lat: number
	long: number
}

type Props = {
	stations: Station[]
	measurements: StationMeasurementsMap
	selectedMetric: MetricOption
	enabled: boolean
}

const GRID_SIZE = 120
const OVERLAY_OPACITY = 0.48
const INTERPOLATION_PANE = "metricInterpolationPane"

function ensureInterpolationPane(map: L.Map): string {
	if (!map.getPane(INTERPOLATION_PANE)) {
		const pane = map.createPane(INTERPOLATION_PANE)!
		pane.style.zIndex = "450"
		pane.style.pointerEvents = "none"
	}
	return INTERPOLATION_PANE
}

export default function MetricInterpolationLayer({
	stations,
	measurements,
	selectedMetric,
	enabled
}: Props) {
	const map = useMap()
	const overlayRef = useRef<L.ImageOverlay | null>(null)

	useEffect(() => {
		ensureInterpolationPane(map)
		const scale = getValueColorScaleForMetric(selectedMetric)

		const removeOverlay = () => {
			if (overlayRef.current) {
				map.removeLayer(overlayRef.current)
				overlayRef.current = null
			}
		}

		if (!enabled || selectedMetric === "default" || !scale) {
			removeOverlay()
			return
		}

		const samples: GeoSample[] = []
		for (const station of stations) {
			const value = measurements[station.id]?.values[selectedMetric]
			if (typeof value !== "number") {
				continue
			}
			samples.push({ lat: station.lat, lng: station.long, value })
		}

		if (samples.length < 2) {
			removeOverlay()
			return
		}

		const redraw = () => {
			const bounds = map.getBounds()
			const geoBounds = {
				south: bounds.getSouth(),
				west: bounds.getWest(),
				north: bounds.getNorth(),
				east: bounds.getEast()
			}

			const canvas = renderIdwHeatmapCanvas(
				geoBounds,
				GRID_SIZE,
				GRID_SIZE,
				samples,
				(value) => colorAtConcentration(scale, value),
				OVERLAY_OPACITY
			)

			removeOverlay()
			if (!canvas) {
				return
			}

			const leafletBounds = L.latLngBounds(
				[geoBounds.south, geoBounds.west],
				[geoBounds.north, geoBounds.east]
			)

			overlayRef.current = L.imageOverlay(canvas.toDataURL(), leafletBounds, {
				opacity: 1,
				interactive: false,
				className: "metric-idw-overlay",
				pane: INTERPOLATION_PANE
			})
			overlayRef.current.addTo(map)
			overlayRef.current.bringToFront()
		}

		redraw()
		map.on("moveend", redraw)
		map.on("zoomend", redraw)
		map.on("resize", redraw)

		return () => {
			map.off("moveend", redraw)
			map.off("zoomend", redraw)
			map.off("resize", redraw)
			removeOverlay()
		}
	}, [map, stations, measurements, selectedMetric, enabled])

	return null
}
