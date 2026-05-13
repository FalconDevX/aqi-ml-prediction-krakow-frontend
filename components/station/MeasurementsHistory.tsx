"use client"

import MeasurementsChart from "@/components/station/MeasurementsChart"
import { fetchModelPredictionPoints } from "@/lib/modelPrediction"
import { useEffect, useMemo, useState } from "react"

type HistoryRow = Record<string, unknown>

type Props = {
	history: HistoryRow[]
	stationId: string
}

const EXCLUDED_KEYS = new Set(["id", "station_id", "timestamp"])

const LABELS: Record<string, string> = {
	pm1: "PM1",
	pm25: "PM2.5",
	pm10: "PM10",
	no2: "NO2",
	so2: "SO2",
	co: "CO",
	o3: "O3",
	caqi: "CAQI"
}

function formatLabel(key: string): string {
	return LABELS[key] ?? key.replaceAll("_", " ").toUpperCase()
}

export default function MeasurementsHistory({ history, stationId }: Props) {
	const availableMetrics = useMemo(() => {
		if (history.length === 0) {
			return [] as string[]
		}

		const keys = new Set<string>()

		for (const row of history) {
			for (const [key, value] of Object.entries(row)) {
				if (!EXCLUDED_KEYS.has(key) && typeof value === "number") {
					keys.add(key)
				}
			}
		}

		return [...keys]
	}, [history])

	const [showAiModel, setShowAiModel] = useState(false)
	const [aiPredictionPoints, setAiPredictionPoints] = useState<{ timestamp: string; value: number }[] | null>(null)
	const [aiError, setAiError] = useState<string | null>(null)

	useEffect(() => {
		if (!showAiModel || !stationId || !selectedMetric) {
			setAiPredictionPoints(null)
			setAiError(null)
			return
		}

		let cancelled = false
		setAiPredictionPoints(null)
		setAiError(null)

		void (async () => {
			try {
				const pts = await fetchModelPredictionPoints(stationId, selectedMetric)
				if (cancelled) {
					return
				}
				setAiPredictionPoints(pts)
				if (pts.length === 0) {
					setAiError("Brak danych predykcji dla tego wskaźnika.")
				}
			} catch (err) {
				if (cancelled) {
					return
				}
				setAiPredictionPoints([])
				setAiError(err instanceof Error ? err.message : "Nie udało się pobrać predykcji modelu.")
			}
		})()

		return () => {
			cancelled = true
		}
	}, [showAiModel, stationId, selectedMetric])

	useEffect(() => {
		if (!selectedMetric && availableMetrics[0]) {
			setSelectedMetric(availableMetrics[0])
			return
		}

		if (selectedMetric && !availableMetrics.includes(selectedMetric)) {
			setSelectedMetric(availableMetrics[0] ?? "")
		}
	}, [availableMetrics, selectedMetric])

	const points = useMemo(() => {
		if (!selectedMetric) {
			return []
		}

		return history
			.map((row) => {
				const timestamp = row.timestamp
				const value = row[selectedMetric]

				if (typeof timestamp !== "string" || typeof value !== "number") {
					return null
				}

				return { timestamp, value }
			})
			.filter((point): point is { timestamp: string; value: number } => point !== null)
	}, [history, selectedMetric])

	return (
		<section className="max-w-3xl">
			<MeasurementsChart
				title="Wykres ostatnich pomiarów"
				points={points}
				predictionPoints={showAiModel ? aiPredictionPoints : null}
				metricKey={selectedMetric}
				headerControl={
					<div className="flex flex-wrap items-center gap-3">
						<select
							value={selectedMetric}
							onChange={(event) => setSelectedMetric(event.target.value)}
							className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-lime-400"
							aria-label="Lista parametrow"
						>
							{availableMetrics.map((metric) => (
								<option key={metric} value={metric}>
									{formatLabel(metric)}
								</option>
							))}
						</select>

						<label className="flex items-center gap-1 text-xs text-zinc-300">
							<input
								type="checkbox"
								checked={interpolate}
								onChange={(event) => setInterpolate(event.target.checked)}
								className="h-3.5 w-3.5 accent-lime-400"
							/>
							Interpolate
						</label>

						<label className="flex items-center gap-1 text-xs text-zinc-300">
							<input
								type="checkbox"
								checked={showAiModel}
								onChange={(event) => setShowAiModel(event.target.checked)}
								className="h-3.5 w-3.5 accent-sky-400"
							/>
							Model AI
						</label>
					</div>
				}
				interpolate={interpolate}
			/>
			{showAiModel && aiError ? (
				<p className="mt-2 text-xs text-red-400/90" role="alert">
					{aiError}
				</p>
			) : null}
		</section>
	)
}
