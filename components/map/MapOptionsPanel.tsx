"use client"

import {
	getValueColorScaleForMetric,
	scaleToCssBandGradient,
	valueScaleLegendTicks
} from "@/lib/chartMetricColorScales"
import { useMemo } from "react"

type MetricOption =
	| "default"
	| "pm1"
	| "pm25"
	| "pm10"
	| "temperature"
	| "humidity"
	| "pressure"
	| "no2"
	| "no"
	| "co"
	| "o3"
	| "so2"
	| "caqi"

type Props = {
	selectedMetric: MetricOption
	onMetricChange: (metric: MetricOption) => void
	geospatialApprox: boolean
	onGeospatialApproxChange: (enabled: boolean) => void
}

const OPTIONS: Array<{ value: MetricOption; label: string }> = [
	{ value: "default", label: "Domyslny" },
	{ value: "pm1", label: "PM1" },
	{ value: "pm25", label: "PM2.5" },
	{ value: "pm10", label: "PM10" },
	{ value: "temperature", label: "Temperature" },
	{ value: "humidity", label: "Humidity" },
	{ value: "pressure", label: "Pressure" },
	{ value: "no2", label: "NO2" },
	{ value: "no", label: "NO" },
	{ value: "co", label: "CO" },
	{ value: "o3", label: "O3" },
	{ value: "so2", label: "SO2" },
	{ value: "caqi", label: "CAQI" }
]

export type { MetricOption }

export default function MapOptionsPanel({
	selectedMetric,
	onMetricChange,
	geospatialApprox,
	onGeospatialApproxChange
}: Props) {
	const valueScale = getValueColorScaleForMetric(selectedMetric)
	const scaleLegendTicks = useMemo(
		() => (valueScale ? valueScaleLegendTicks(valueScale) : []),
		[valueScale]
	)

	return (
		<aside className="h-full w-full rounded-xl border border-gray-700 bg-[#0b0e14]/90 p-4 text-zinc-100">
			<h2 className="text-sm font-semibold tracking-wide">Opcje mapy</h2>
			<p className="mt-1 text-xs text-zinc-400">Lista parametrow</p>

			<div className="mt-3">
				<select
					value={selectedMetric}
					onChange={(event) => onMetricChange(event.target.value as MetricOption)}
					className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-100 outline-none focus:border-lime-400"
					aria-label="Wybierz parametr mapy"
				>
					{OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-200">
				<input
					type="checkbox"
					checked={geospatialApprox}
					onChange={(event) => onGeospatialApproxChange(event.target.checked)}
					disabled={selectedMetric === "default" || !valueScale}
					className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-lime-400"
				/>
				<span>
					Aproksymacja geoprzestrzenna kolorów
					<span className="mt-0.5 block text-xs text-zinc-500">
						Interpolacja IDW między stacjami (wymaga wybranej metryki z skalą)
					</span>
				</span>
			</label>

			{valueScale ? (
				<div className="mt-5">
					<p className="text-xs font-medium text-zinc-300">
						Skala {valueScale.id.toUpperCase()} ({valueScale.unitLabel})
					</p>
					<div
						className="mt-2 h-3 w-full rounded-sm border border-zinc-700"
						style={{ background: scaleToCssBandGradient(valueScale) }}
						role="img"
						aria-label={`Skala kolorów ${valueScale.id}`}
					/>
					<div className="relative mt-1 h-4 w-full text-[10px] text-zinc-500">
						{scaleLegendTicks.map((tick) => (
							<span
								key={tick.value}
								className="absolute -translate-x-1/2 whitespace-nowrap"
								style={{ left: `${tick.positionPct}%` }}
							>
								{tick.value}
							</span>
						))}
					</div>
				</div>
			) : null}
		</aside>
	)
}
