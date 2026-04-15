"use client"

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

export default function MapOptionsPanel({ selectedMetric, onMetricChange }: Props) {
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
		</aside>
	)
}
