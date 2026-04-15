"use client"

import { useMemo, useState } from "react"

type MeasurementPoint = {
	timestamp: string
	value: number
}

type Props = {
	title: string
	points: MeasurementPoint[]
	headerControl?: React.ReactNode
	interpolate?: boolean
}

type ChartPoint = MeasurementPoint & {
	x: number
	y: number
}

type ChartPadding = {
	top: number
	right: number
	bottom: number
	left: number
}

function toChartCoordinates(
	points: MeasurementPoint[],
	width: number,
	height: number,
	padding: ChartPadding
): ChartPoint[] {
	if (points.length === 0) {
		return []
	}

	const values = points.map((p) => p.value)
	const min = Math.min(...values)
	const max = Math.max(...values)
	const valueRange = max - min || 1
	const innerWidth = width - padding.left - padding.right
	const innerHeight = height - padding.top - padding.bottom

	return points.map((point, index) => {
		const x =
			points.length === 1 ? padding.left + innerWidth / 2 : padding.left + (index / (points.length - 1)) * innerWidth
		const y = padding.top + ((max - point.value) / valueRange) * innerHeight
		return { ...point, x, y }
	})
}

function formatYTick(value: number): string {
	const abs = Math.abs(value)
	if (abs >= 1000) {
		return value.toFixed(0)
	}
	if (abs >= 100) {
		return value.toFixed(0)
	}
	if (abs >= 10) {
		return value.toFixed(1)
	}
	return value.toFixed(2)
}

function yAxisTicks(min: number, max: number, count: number): number[] {
	if (min === max) {
		return [min]
	}
	const n = Math.max(2, count)
	return Array.from({ length: n }, (_, i) => min + ((max - min) * i) / (n - 1))
}

function formatXAxisTime(timestamp: string, showDate: boolean): string {
	const date = new Date(timestamp)
	if (Number.isNaN(date.getTime())) {
		return ""
	}
	if (showDate) {
		return date.toLocaleString("pl-PL", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false
		})
	}
	return date.toLocaleTimeString("pl-PL", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	})
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

function toSmoothPath(points: ChartPoint[]): string {
	if (points.length === 0) {
		return ""
	}
	if (points.length === 1) {
		return `M ${points[0].x} ${points[0].y}`
	}
	if (points.length === 2) {
		return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
	}

	let path = `M ${points[0].x} ${points[0].y}`

	for (let i = 0; i < points.length - 1; i += 1) {
		const p0 = points[i - 1] ?? points[i]
		const p1 = points[i]
		const p2 = points[i + 1]
		const p3 = points[i + 2] ?? p2

		const cp1x = p1.x + (p2.x - p0.x) / 6
		const cp1y = p1.y + (p2.y - p0.y) / 6
		const cp2x = p2.x - (p3.x - p1.x) / 6
		const cp2y = p2.y - (p3.y - p1.y) / 6

		path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
	}

	return path
}

export default function MeasurementsChart({ title, points, headerControl, interpolate = false }: Props) {
	const width = 760
	const height = 220
	const padding: ChartPadding = {
		top: 14,
		right: 14,
		bottom: 44,
		left: 52
	}
	const xAxisY = height - padding.bottom
	const yAxisX = padding.left
	const plotTop = padding.top
	const plotBottom = height - padding.bottom
	const [activeIndex, setActiveIndex] = useState<number | null>(null)
	const chartPoints = useMemo(() => toChartCoordinates(points, width, height, padding), [points])
	const polylinePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(" ")
	const smoothPath = toSmoothPath(chartPoints)
	const lastPoint = points.at(-1)
	const activePoint = activeIndex !== null && chartPoints[activeIndex] ? chartPoints[activeIndex] : null
	const values = points.map((p) => p.value)
	const minValue = values.length ? Math.min(...values) : 0
	const maxValue = values.length ? Math.max(...values) : 0
	const valueRange = maxValue - minValue || 1
	const innerHeight = plotBottom - plotTop

	const yTickValues = useMemo(() => yAxisTicks(minValue, maxValue, 5), [minValue, maxValue])

	const xAxisShowDate = useMemo(() => {
		if (points.length < 2) {
			return false
		}
		const a = new Date(points[0].timestamp).getTime()
		const b = new Date(points[points.length - 1].timestamp).getTime()
		if (Number.isNaN(a) || Number.isNaN(b)) {
			return false
		}
		return b - a >= 86_400_000
	}, [points])

	const xTickIndices = useMemo(() => {
		const n = points.length
		if (n === 0) {
			return []
		}
		const want = Math.min(6, n)
		if (want === 1) {
			return [0]
		}
		const raw = Array.from({ length: want }, (_, i) => Math.round((i * (n - 1)) / (want - 1)))
		return [...new Set(raw)]
	}, [points])

	const yForValue = (v: number) => plotTop + ((maxValue - v) / valueRange) * innerHeight

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
				<div className="w-full">
					<svg
						viewBox={`0 0 ${width} ${height}`}
						className="h-[220px] w-full rounded-lg bg-zinc-950/70"
						aria-label={`${title} chart`}
						role="img"
						onMouseMove={(event) => {
							const svg = event.currentTarget
							const rect = svg.getBoundingClientRect()
							const relativeX = event.clientX - rect.left
							const clampedX = Math.max(0, Math.min(rect.width, relativeX))
							const ratio = rect.width === 0 ? 0 : clampedX / rect.width
							const index = Math.round(ratio * (chartPoints.length - 1))
							setActiveIndex(index)
						}}
						onMouseLeave={() => setActiveIndex(null)}
					>
						<line
							x1={yAxisX}
							y1={xAxisY}
							x2={width - padding.right}
							y2={xAxisY}
							className="stroke-zinc-700"
							strokeWidth="1"
						/>
						<line x1={yAxisX} y1={plotTop} x2={yAxisX} y2={xAxisY} className="stroke-zinc-700" strokeWidth="1" />
						{yTickValues.map((tick) => {
							const y = yForValue(tick)
							return (
								<g key={`y-${tick}`}>
									<line x1={yAxisX - 4} y1={y} x2={yAxisX} y2={y} className="stroke-zinc-600" strokeWidth="1" />
									<text x={yAxisX - 8} y={y + 3} textAnchor="end" className="fill-zinc-500" style={{ fontSize: 10 }}>
										{formatYTick(tick)}
									</text>
								</g>
							)
						})}
						{xTickIndices.map((idx) => {
							const pt = chartPoints[idx]
							const label = points[idx] ? formatXAxisTime(points[idx].timestamp, xAxisShowDate) : ""
							if (!pt) {
								return null
							}
							return (
								<g key={`x-${idx}`}>
									<line x1={pt.x} y1={xAxisY} x2={pt.x} y2={xAxisY + 4} className="stroke-zinc-600" strokeWidth="1" />
									<text x={pt.x} y={xAxisY + 18} textAnchor="middle" className="fill-zinc-500" style={{ fontSize: 10 }}>
										{label}
									</text>
								</g>
							)
						})}
						{interpolate ? (
							<path
								d={smoothPath}
								fill="none"
								className="stroke-lime-400"
								strokeWidth="2"
								strokeLinejoin="round"
								strokeLinecap="round"
							/>
						) : (
							<polyline
								points={polylinePoints}
								fill="none"
								className="stroke-lime-400"
								strokeWidth="2"
								strokeLinejoin="round"
								strokeLinecap="round"
							/>
						)}
						{activePoint ? (
							<>
								<line
									x1={activePoint.x}
									y1={plotTop}
									x2={activePoint.x}
									y2={plotBottom}
									className="stroke-zinc-600"
									strokeDasharray="4 4"
									strokeWidth="1"
								/>
								<circle cx={activePoint.x} cy={activePoint.y} r="4" className="fill-lime-300" />
							</>
						) : null}
					</svg>

					<div className="mt-2 text-center text-[11px] text-zinc-500">
						Pełny zakres czasu: {startTime} — {endTime}
					</div>

					<div className="mt-1 h-8 text-xs text-zinc-300">
						{activePoint ? (
							<p>
								<span className="text-zinc-500">Data:</span> {formatTimestamp(activePoint.timestamp)}{" "}
								<span className="mx-2 text-zinc-600">|</span>
								<span className="text-zinc-500">Wartość:</span> {activePoint.value}
							</p>
						) : (
							<p className="text-zinc-500">Najedz na wykres, aby zobaczyc wartosc w czasie.</p>
						)}
					</div>
				</div>
			)}
		</section>
	)
}
