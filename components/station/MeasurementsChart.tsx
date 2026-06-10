"use client"

import {
	getValueColorScaleForMetric,
	scaleToCssBandGradient,
	valueScaleLegendTicks,
	type ValueColorScale
} from "@/lib/chartMetricColorScales"
import {
	buildWhitespaceTimeScaleSeries,
	connectPredictionToLastMeasurement,
	measurementPointsToChartSeries,
	splitMeasurementPointsByGaps,
	type MeasurementPoint
} from "@/lib/measurementChartSeries"
import {
	ColorType,
	createChart,
	CrosshairMode,
	LastPriceAnimationMode,
	LineSeries,
	LineStyle,
	LineType,
	type IChartApi,
	type ISeriesApi,
	type LineData,
	type MouseEventParams,
	type Time
} from "lightweight-charts"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Props = {
	title: string
	points: MeasurementPoint[]
	/** Dane predykcji z `/model/prediction/...`; `null` = wyłączone lub brak serii. */
	predictionPoints?: MeasurementPoint[] | null
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

type HoverInfo = {
	timestampIso: string
	measured?: number
	predicted?: number
}

type LightweightMeasurementsPlotProps = {
	points: MeasurementPoint[]
	predictionPoints: MeasurementPoint[] | null
	/** Włączone = poprzednie zachowanie: krzywa + łączenie przez luki. */
	interpolate: boolean
	metricKey: string
}

type LineSeriesApi = ISeriesApi<"Line", Time>

const BASE_LINE_SERIES_OPTIONS = {
	lastPriceAnimation: LastPriceAnimationMode.Disabled,
	priceLineVisible: false,
	lastValueVisible: false
} as const

function readSeriesValue(
	param: MouseEventParams<Time>,
	seriesList: LineSeriesApi[]
): number | undefined {
	for (const target of seriesList) {
		const row = param.seriesData.get(target) as LineData<Time> | undefined
		if (row && typeof row.value === "number") {
			return row.value
		}
	}
	return undefined
}

function clearChartSeries(chart: IChartApi, refs: LineSeriesApi[]): void {
	for (const target of refs) {
		chart.removeSeries(target)
	}
	refs.length = 0
}

function syncSegmentSeries(
	chart: IChartApi,
	segments: MeasurementPoint[][],
	refs: LineSeriesApi[],
	options: {
		color: string
		lineStyle?: LineStyle
		lineType: LineType
		valueScale?: ValueColorScale
	}
): void {
	clearChartSeries(chart, refs)

	for (const segment of segments) {
		if (segment.length === 0) {
			continue
		}

		const target = chart.addSeries(LineSeries, {
			...BASE_LINE_SERIES_OPTIONS,
			color: options.color,
			lineWidth: 2,
			lineStyle: options.lineStyle ?? LineStyle.Solid,
			lineType: options.lineType,
			crosshairMarkerVisible: true
		})
		target.setData(measurementPointsToChartSeries(segment, options.valueScale, { breakGaps: false }))
		refs.push(target)
	}
}

function buildMeasurementKey(
	points: MeasurementPoint[],
	interpolate: boolean,
	metricKey: string
): string {
	const first = points[0]?.timestamp ?? ""
	const last = points.at(-1)?.timestamp ?? ""
	return `${interpolate}|${metricKey}|${points.length}|${first}|${last}`
}

function buildPredictionKey(predictionPoints: MeasurementPoint[] | null): string {
	const prediction = predictionPoints ?? []
	const predFirst = prediction[0]?.timestamp ?? ""
	const predLast = prediction.at(-1)?.timestamp ?? ""
	return `${prediction.length}|${predFirst}|${predLast}`
}

function LightweightMeasurementsPlot({
	points,
	predictionPoints,
	interpolate,
	metricKey
}: LightweightMeasurementsPlotProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<IChartApi | null>(null)
	const timeScaleSeriesRef = useRef<LineSeriesApi | null>(null)
	const seriesRef = useRef<LineSeriesApi | null>(null)
	const segmentSeriesRef = useRef<LineSeriesApi[]>([])
	const predictionSeriesRef = useRef<LineSeriesApi | null>(null)
	const predictionSegmentSeriesRef = useRef<LineSeriesApi[]>([])
	const measurementKeyRef = useRef("")
	const predictionKeyRef = useRef("")
	const [hover, setHover] = useState<HoverInfo | null>(null)
	const lastHoverRef = useRef<HoverInfo | null>(null)

	const valueScale = useMemo(
		() => (metricKey ? getValueColorScaleForMetric(metricKey) : undefined),
		[metricKey]
	)

	const emitHover = useCallback((info: HoverInfo | null) => {
		const prev = lastHoverRef.current
		if (
			prev?.timestampIso === info?.timestampIso &&
			prev?.measured === info?.measured &&
			prev?.predicted === info?.predicted
		) {
			return
		}
		lastHoverRef.current = info
		setHover(info)
	}, [])

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
			handleScroll: {
				mouseWheel: false,
				pressedMouseMove: false,
				horzTouchDrag: false,
				vertTouchDrag: false
			},
			handleScale: {
				mouseWheel: false,
				pinch: false,
				axisPressedMouseMove: false,
				axisDoubleClickReset: false
			},
			kineticScroll: {
				touch: false,
				mouse: false
			},
			crosshair: {
				mode: CrosshairMode.Magnet,
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

		const timeScaleSeries = chart.addSeries(LineSeries, {
			color: "rgba(0,0,0,0)",
			lineWidth: 1,
			lineVisible: false,
			pointMarkersVisible: false,
			crosshairMarkerVisible: false,
			lastValueVisible: false,
			priceLineVisible: false
		})

		const series = chart.addSeries(LineSeries, {
			...BASE_LINE_SERIES_OPTIONS,
			color: "#a3e635",
			lineWidth: 2,
			lineType: interpolate ? LineType.Curved : LineType.Simple,
			crosshairMarkerVisible: true
		})

		const predSeries = chart.addSeries(LineSeries, {
			...BASE_LINE_SERIES_OPTIONS,
			color: "#38bdf8",
			lineWidth: 2,
			lineStyle: LineStyle.Dashed,
			lineType: interpolate ? LineType.Curved : LineType.Simple,
			crosshairMarkerVisible: true
		})

		chartRef.current = chart
		timeScaleSeriesRef.current = timeScaleSeries
		seriesRef.current = series
		predictionSeriesRef.current = predSeries

		const onCrosshairMove = (param: MouseEventParams<Time>) => {
			if (!chartRef.current) {
				return
			}

			if (param.time === undefined || param.point === undefined) {
				emitHover(null)
				return
			}

			try {
				const iso = timeToIso(param.time)
				if (!iso) {
					emitHover(null)
					return
				}
				const measured = readSeriesValue(param, [series, ...segmentSeriesRef.current])
				const predicted = readSeriesValue(param, [
					predSeries,
					...predictionSegmentSeriesRef.current
				])
				if (measured === undefined && predicted === undefined) {
					emitHover(null)
					return
				}
				emitHover({ timestampIso: iso, measured, predicted })
			} catch {
				emitHover(null)
			}
		}

		chart.subscribeCrosshairMove(onCrosshairMove)

		return () => {
			chart.unsubscribeCrosshairMove(onCrosshairMove)
			clearChartSeries(chart, segmentSeriesRef.current)
			clearChartSeries(chart, predictionSegmentSeriesRef.current)
			chart.remove()
			chartRef.current = null
			timeScaleSeriesRef.current = null
			seriesRef.current = null
			predictionSeriesRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- jedna instancja wykresu; interpolate aktualizuje osobny efekt
	}, [])

	useEffect(() => {
		const series = seriesRef.current
		const pred = predictionSeriesRef.current
		const timeScaleSeries = timeScaleSeriesRef.current
		const chart = chartRef.current
		if (!series || !pred || !timeScaleSeries || !chart) {
			return
		}

		const measurementKey = buildMeasurementKey(points, interpolate, metricKey)
		const predictionKey = buildPredictionKey(predictionPoints)
		const measurementChanged = measurementKeyRef.current !== measurementKey
		const predictionChanged = predictionKeyRef.current !== predictionKey

		if (!measurementChanged && !predictionChanged) {
			return
		}

		const connectedPrediction = connectPredictionToLastMeasurement(points, predictionPoints ?? [])
		const lineType = interpolate ? LineType.Curved : LineType.Simple

		if (measurementChanged) {
			measurementKeyRef.current = measurementKey

			if (interpolate) {
				timeScaleSeries.setData([])
				clearChartSeries(chart, segmentSeriesRef.current)
				series.setData(measurementPointsToChartSeries(points, valueScale, { breakGaps: false }))
			} else {
				timeScaleSeries.setData(buildWhitespaceTimeScaleSeries(points, connectedPrediction))
				series.setData([])
				syncSegmentSeries(chart, splitMeasurementPointsByGaps(points), segmentSeriesRef.current, {
					color: "#a3e635",
					lineType,
					valueScale
				})
			}
		}

		if (measurementChanged || predictionChanged) {
			predictionKeyRef.current = predictionKey
			clearChartSeries(chart, predictionSegmentSeriesRef.current)

			if (!interpolate) {
				timeScaleSeries.setData(buildWhitespaceTimeScaleSeries(points, connectedPrediction))
			}

			pred.setData(
				connectedPrediction.length > 0
					? measurementPointsToChartSeries(connectedPrediction, undefined, { breakGaps: false })
					: []
			)
			pred.applyOptions({
				...BASE_LINE_SERIES_OPTIONS,
				lineStyle: LineStyle.Dashed,
				lineType,
				color: "#38bdf8",
				crosshairMarkerVisible: true
			})
		}

		if (measurementChanged) {
			chart.timeScale().fitContent()
		}
	}, [points, predictionPoints, interpolate, metricKey])

	useEffect(() => {
		const chart = chartRef.current
		if (!chart) {
			return
		}

		const interactive = !interpolate
		chart.applyOptions({
			handleScroll: {
				mouseWheel: interactive,
				pressedMouseMove: interactive,
				horzTouchDrag: interactive,
				vertTouchDrag: false
			},
			handleScale: {
				mouseWheel: interactive,
				pinch: interactive,
				axisPressedMouseMove: interactive ? { time: true, price: false } : false,
				axisDoubleClickReset: interactive
			},
			kineticScroll: {
				touch: interactive,
				mouse: interactive
			}
		})
	}, [interpolate])

	return (
		<>
			<div
				ref={containerRef}
				className="h-[220px] w-full min-w-0 overflow-hidden rounded-lg border border-zinc-800/80"
			/>
			<div className="mt-1 min-h-8 text-xs text-zinc-300">
				{hover ? (
					<p>
						<span className="text-zinc-500">Data:</span> {formatTimestamp(hover.timestampIso)}
						{hover.measured !== undefined ? (
							<>
								{" "}
								<span className="mx-2 text-zinc-600">|</span>
								<span className="text-zinc-500">Pomiar:</span> {hover.measured}
							</>
						) : null}
						{hover.predicted !== undefined ? (
							<>
								{" "}
								<span className="mx-2 text-zinc-600">|</span>
								<span className="text-sky-400/90">AI:</span> {hover.predicted}
							</>
						) : null}
					</p>
				) : (
					<p className="text-zinc-500">Najedź na wykres, aby zobaczyć wartość w czasie.</p>
				)}
			</div>
		</>
	)
}

export default function MeasurementsChart({
	title,
	points,
	predictionPoints = null,
	metricKey = "",
	headerControl,
	interpolate = false
}: Props) {
	const valueScale = useMemo(
		() => (metricKey ? getValueColorScaleForMetric(metricKey) : undefined),
		[metricKey]
	)
	const scaleLegendTicks = useMemo(
		() => (valueScale ? valueScaleLegendTicks(valueScale) : []),
		[valueScale]
	)

	const lastPoint = points.at(-1)
	const startTime = points[0]?.timestamp ? formatTimestamp(points[0].timestamp) : "-"
	const endTime = points.at(-1)?.timestamp ? formatTimestamp(points.at(-1)!.timestamp) : "-"

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
						predictionPoints={predictionPoints ?? null}
						interpolate={interpolate}
						metricKey={metricKey}
					/>

					<div className="mt-2 text-center text-[11px] text-zinc-500">
						Pełny zakres czasu: {startTime} — {endTime}
						{!interpolate ? (
							<span className="mt-0.5 block">
								Przewijanie: przeciągnij wykres · Zoom osi X: kółko myszy · Reset: podwójne kliknięcie osi
							</span>
						) : null}
					</div>

				</div>
			)}
		</section>
	)
}
