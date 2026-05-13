"use client"

import {
	colorAtConcentration,
	getValueColorScaleForMetric,
	scaleToCssBandGradient,
	valueScaleLegendTicks,
	type ValueColorScale
} from "@/lib/chartMetricColorScales"
import {
	ColorType,
	createChart,
	CrosshairMode,
	LastPriceAnimationMode,
	LineSeries,
	LineType,
	type IChartApi,
	type ISeriesApi,
	type LineData,
	type MouseEventParams,
	type Time,
	type UTCTimestamp
} from "lightweight-charts"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type MeasurementPoint = {
	timestamp: string
	value: number
}

type Props = {
	title: string
	points: MeasurementPoint[]
	metricKey?: string
	headerControl?: React.ReactNode
	interpolate?: boolean
}

function formatTimestamp(timestamp: string): string {
	const date = new Date(timestamp)
	if (Number.isNaN(date.getTime())) {
		return timestamp
	}
	return date.toLocaleString("pl-PL", {
		hour12: false,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	})
}

function timeToIso(time: Time): string | null {
	if (typeof time === "number") {
		return new Date(time * 1000).toISOString()
	}
	if (typeof time === "string") {
		const d = new Date(time)
		return Number.isNaN(d.getTime()) ? null : d.toISOString()
	}
	if (time && typeof time === "object" && "year" in time) {
		const { year, month, day } = time as { year: number; month: number; day: number }
		return new Date(Date.UTC(year, month - 1, day)).toISOString()
	}
	return null
}

function measurementPointsToLineData(
	points: MeasurementPoint[],
	valueScale: ValueColorScale | undefined
): LineData<Time>[] {
	let lastSec = -Infinity
	const out: LineData<Time>[] = []

	for (const p of points) {
		const ms = Date.parse(p.timestamp)
		if (Number.isNaN(ms)) {
			continue
		}
		let sec = Math.floor(ms / 1000)
		if (sec <= lastSec) {
			sec = lastSec + 1
		}
		lastSec = sec

		const item: LineData<Time> = {
			time: sec as UTCTimestamp,
			value: p.value
		}
		if (valueScale) {
			item.color = colorAtConcentration(valueScale, p.value)
		}
		out.push(item)
	}

	return out
}

type LineSeriesApi = ISeriesApi<"Line", Time>

function LightweightMeasurementsPlot({
	points,
	interpolate,
	valueScale,
	onHoverChange
}: {
	points: MeasurementPoint[]
	interpolate: boolean
	valueScale: ValueColorScale | undefined
	onHoverChange: (info: { timestampIso: string; value: number } | null) => void
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<IChartApi | null>(null)
	const seriesRef = useRef<LineSeriesApi | null>(null)
	const hoverCbRef = useRef(onHoverChange)

	useEffect(() => {
		hoverCbRef.current = onHoverChange
	}, [onHoverChange])

	useEffect(() => {
		const el = containerRef.current
		if (!el) {
			return
		}

		const chart = createChart(el, {
			autoSize: true,
			height: 220,
			layout: {
				background: { type: ColorType.Solid, color: "#0c0c0e" },
				textColor: "#a1a1aa",
				fontSize: 11,
				attributionLogo: false
			},
			grid: {
				vertLines: { color: "rgba(63,63,70,0.45)" },
				horzLines: { color: "rgba(63,63,70,0.45)" }
			},
			localization: { locale: "pl-PL" },
			crosshair: {
				mode: CrosshairMode.Normal,
				vertLine: { labelBackgroundColor: "#3f3f46" },
				horzLine: { labelBackgroundColor: "#3f3f46" }
			},
			rightPriceScale: {
				borderColor: "#3f3f46",
				scaleMargins: { top: 0.08, bottom: 0.12 }
			},
			timeScale: {
				borderColor: "#3f3f46",
				timeVisible: true,
				secondsVisible: false
			}
		})

		const series = chart.addSeries(LineSeries, {
			color: "#a3e635",
			lineWidth: 2,
			lineType: interpolate ? LineType.Curved : LineType.Simple,
			crosshairMarkerVisible: true,
			lastPriceAnimation: LastPriceAnimationMode.Disabled
		})

		chartRef.current = chart
		seriesRef.current = series

		const onCrosshairMove = (param: MouseEventParams<Time>) => {
			const row = param.seriesData.get(series) as LineData<Time> | undefined
			if (row && typeof row.value === "number" && param.time !== undefined) {
				const iso = timeToIso(param.time)
				if (iso) {
					hoverCbRef.current({ timestampIso: iso, value: row.value })
					return
				}
			}
			hoverCbRef.current(null)
		}

		chart.subscribeCrosshairMove(onCrosshairMove)

		return () => {
			chart.unsubscribeCrosshairMove(onCrosshairMove)
			chart.remove()
			chartRef.current = null
			seriesRef.current = null
			hoverCbRef.current(null)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- jedna instancja wykresu; interpolate aktualizuje osobny efekt
	}, [])

	useEffect(() => {
		const series = seriesRef.current
		const chart = chartRef.current
		if (!series || !chart) {
			return
		}
		series.setData(measurementPointsToLineData(points, valueScale))
		chart.timeScale().fitContent()
	}, [points, valueScale])

	useEffect(() => {
		seriesRef.current?.applyOptions({
			lineType: interpolate ? LineType.Curved : LineType.Simple
		})
	}, [interpolate])

	return <div ref={containerRef} className="h-[220px] w-full min-w-0 overflow-hidden rounded-lg border border-zinc-800/80" />
}

export default function MeasurementsChart({
	title,
	points,
	metricKey = "",
	headerControl,
	interpolate = false
}: Props) {
	const [hover, setHover] = useState<{ timestampIso: string; value: number } | null>(null)

	const valueScale = metricKey ? getValueColorScaleForMetric(metricKey) : undefined
	const scaleLegendTicks = useMemo(
		() => (valueScale ? valueScaleLegendTicks(valueScale) : []),
		[valueScale]
	)

	const lastPoint = points.at(-1)
	const startTime = points[0]?.timestamp ? formatTimestamp(points[0].timestamp) : "-"
	const endTime = points.at(-1)?.timestamp ? formatTimestamp(points.at(-1)!.timestamp) : "-"

	const onHoverChange = useCallback((info: { timestampIso: string; value: number } | null) => {
		queueMicrotask(() => setHover(info))
	}, [])

	return (
		<section className="mt-4 rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-3 shadow-2xl backdrop-blur-sm">
			<header className="mb-3 flex items-center justify-between">
				<h2 className="text-sm font-medium tracking-wide text-zinc-200">{title}</h2>
				<div className="flex items-center gap-3">
					<p className="text-xs text-zinc-400">Ostatnia wartość: {lastPoint ? lastPoint.value : "-"}</p>
					{headerControl}
				</div>
			</header>

			{points.length === 0 ? (
				<p className="text-sm text-zinc-400">Brak danych do wykresu.</p>
			) : (
				<div className="w-full min-w-0">
					{valueScale ? (
						<div className="mb-2 max-w-md space-y-0.5">
							<p className="text-[10px] uppercase tracking-wide text-zinc-500">
								Skala kolorów {valueScale.id.toUpperCase()} ({valueScale.unitLabel})
							</p>
							<div className="relative w-full">
								<div
									className="h-1 w-full rounded-sm border border-zinc-700/80"
									style={{ background: scaleToCssBandGradient(valueScale) }}
									role="presentation"
								/>
								<div className="relative mt-0.5 h-3.5 w-full font-mono text-[9px] leading-none text-zinc-500">
									{scaleLegendTicks.map((tick) => {
										const { positionPct, value } = tick
										const alignEnd = positionPct >= 99.9
										const alignStart = positionPct <= 0.1
										return (
											<span
												key={`${value}-${positionPct}`}
												className="absolute top-0 whitespace-nowrap"
												style={{
													left: `${positionPct}%`,
													transform: alignStart
														? "translateX(0)"
														: alignEnd
															? "translateX(-100%)"
															: "translateX(-50%)"
												}}
											>
												{value}
											</span>
										)
									})}
								</div>
							</div>
						</div>
					) : null}

					<LightweightMeasurementsPlot
						points={points}
						interpolate={interpolate}
						valueScale={valueScale}
						onHoverChange={onHoverChange}
					/>

					<div className="mt-2 text-center text-[11px] text-zinc-500">
						Pełny zakres czasu: {startTime} — {endTime}
					</div>

					<div className="mt-1 min-h-8 text-xs text-zinc-300">
						{hover ? (
							<p>
								<span className="text-zinc-500">Data:</span> {formatTimestamp(hover.timestampIso)}{" "}
								<span className="mx-2 text-zinc-600">|</span>
								<span className="text-zinc-500">Wartość:</span> {hover.value}
							</p>
						) : (
							<p className="text-zinc-500">Najedź na wykres lub przeciągnij kursor, aby zobaczyć wartość w czasie.</p>
						)}
					</div>
				</div>
			)}
		</section>
	)
}
