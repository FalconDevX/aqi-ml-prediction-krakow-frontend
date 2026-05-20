"use client"

import { createStationFuse, searchStations } from "@/lib/stationSearch"
import type { StationRecord } from "@/lib/stations"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

type Props = {
	stations: StationRecord[]
	query: string
	onQueryChange: (query: string) => void
}

export default function StationSearch({ stations, query, onQueryChange }: Props) {
	const router = useRouter()
	const fuse = useMemo(() => createStationFuse(stations), [stations])
	const results = useMemo(() => searchStations(fuse, query), [fuse, query])
	const trimmedQuery = query.trim()
	const showResults = trimmedQuery.length > 0

	return (
		<aside className="w-full rounded-xl border border-gray-700 bg-[#0b0e14]/90 p-4 text-zinc-100">
			<h2 className="text-sm font-semibold tracking-wide">Wyszukiwarka stacji</h2>
			<p className="mt-1 text-xs text-zinc-400">Nazwa, dzielnica lub ID stacji</p>

			<input
				type="search"
				value={query}
				onChange={(event) => onQueryChange(event.target.value)}
				placeholder="Szukaj stacji…"
				aria-label="Szukaj stacji"
				className="station-search-input mt-3 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-lime-400"
			/>

			{showResults ? (
				<ul className="mt-3 max-h-48 space-y-1 overflow-y-auto" role="listbox" aria-label="Wyniki wyszukiwania">
					{results.length === 0 ? (
						<li className="rounded-md px-2 py-2 text-xs text-zinc-500">Brak wyników</li>
					) : (
						results.map((station) => (
							<li key={station.id}>
								<button
									type="button"
									role="option"
									onClick={() => router.push(`/stations/${station.id}`)}
									className="w-full rounded-md px-2 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-lime-400"
								>
									<span className="font-medium">{station.name}</span>
									<span className="mt-0.5 block text-xs text-zinc-500">
										{station.district} · ID {station.id}
									</span>
								</button>
							</li>
						))
					)}
				</ul>
			) : (
				<p className="mt-3 text-xs text-zinc-500">Wpisz co najmniej 2 znaki, aby zawęzić stacje na mapie.</p>
			)}
		</aside>
	)
}
