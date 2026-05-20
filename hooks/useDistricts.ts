"use client"

import { createTimedCache } from "@/lib/clientDataCache"
import type { GeoJsonObject } from "geojson"
import { useEffect, useState } from "react"

export type District = { data: GeoJsonObject; name: string }

const districtsCache = createTimedCache<District[]>(Number.POSITIVE_INFINITY)

async function fetchDistricts(): Promise<District[]> {
	const res = await fetch("/api/districts")
	if (!res.ok) {
		return []
	}
	return (await res.json()) as District[]
}

export function prefetchDistricts(): Promise<District[]> {
	return districtsCache.load(fetchDistricts)
}

export function useDistricts(): District[] {
	const [districts, setDistricts] = useState<District[]>(() => districtsCache.get() ?? [])

	useEffect(() => {
		let cancelled = false

		prefetchDistricts().then((data) => {
			if (!cancelled) {
				setDistricts(data)
			}
		})

		return () => {
			cancelled = true
		}
	}, [])

	return districts
}
