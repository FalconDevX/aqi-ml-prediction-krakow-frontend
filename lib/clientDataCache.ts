const DEFAULT_TTL_MS = 60_000

type CacheEntry<T> = {
	data: T
	fetchedAt: number
}

export function createTimedCache<T>(ttlMs = DEFAULT_TTL_MS) {
	let entry: CacheEntry<T> | null = null
	let inflight: Promise<T> | null = null

	return {
		get(): T | null {
			if (!entry || Date.now() - entry.fetchedAt >= ttlMs) {
				return null
			}
			return entry.data
		},
		async load(loader: () => Promise<T>): Promise<T> {
			const cached = entry && Date.now() - entry.fetchedAt < ttlMs ? entry.data : null
			if (cached) {
				return cached
			}

			if (inflight) {
				return inflight
			}

			inflight = loader().then((data) => {
				entry = { data, fetchedAt: Date.now() }
				return data
			})

			try {
				return await inflight
			} finally {
				inflight = null
			}
		},
		clear() {
			entry = null
			inflight = null
		}
	}
}
