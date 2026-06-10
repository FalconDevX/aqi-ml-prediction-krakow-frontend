"use client"

import { colorAtConcentration, getValueColorScaleForMetric } from "@/lib/chartMetricColorScales"
import { useDistricts } from "@/hooks/useDistricts"
import type { StationMeasurementsMap } from "@/hooks/useStationMeasurements"
import {
	boundingBoxFromPolygons,
	extractPolygonsFromGeoJson,
	gridDimensionsForBounds,
	renderIdwHeatmapCanvas,
	type GeoSample
} from "@/lib/geospatialInterpolation"
import L from "leaflet"
import { useEffect, useMemo, useRef } from "react"
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

const GRID_LONG_SIDE = 420
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
	const districts = useDistricts()
	const overlayRef = useRef<L.ImageOverlay | null>(null)

	const krakowClipPolygons = useMemo(
		() => districts.flatMap((district) => extractPolygonsFromGeoJson(district.data)),
		[districts]
	)
	const krakowBounds = useMemo(
		() => boundingBoxFromPolygons(krakowClipPolygons),
		[krakowClipPolygons]
	)

	useEffect(() => {
		ensureInterpolationPane(map)
		const scale = getValueColorScaleForMetric(selectedMetric)

		const removeOverlay = () => {
			if (overlayRef.current) {
				map.removeLayer(overlayRef.current)
				overlayRef.current = null
			}
		}

		if (!enabled || selectedMetric === "default" || !scale || !krakowBounds) {
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

		const { width: gridWidth, height: gridHeight } = gridDimensionsForBounds(
			krakowBounds,
			GRID_LONG_SIDE
		)

		const canvas = renderIdwHeatmapCanvas(
			krakowBounds,
			gridWidth,
			gridHeight,
			samples,
			(value) => colorAtConcentration(scale, value),
			OVERLAY_OPACITY,
			krakowClipPolygons
		)

		removeOverlay()
		if (!canvas) {
			return
		}

		const leafletBounds = L.latLngBounds(
			[krakowBounds.south, krakowBounds.west],
			[krakowBounds.north, krakowBounds.east]
		)

		overlayRef.current = L.imageOverlay(canvas.toDataURL(), leafletBounds, {
			opacity: 1,
			interactive: false,
			className: "metric-idw-overlay",
			pane: INTERPOLATION_PANE
		})
		overlayRef.current.addTo(map)
		overlayRef.current.bringToFront()

		return () => {
			removeOverlay()
		}
	}, [
		map,
		stations,
		measurements,
		selectedMetric,
		enabled,
		krakowBounds,
		krakowClipPolygons
	])

	return null
}
