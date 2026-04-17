"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Message = {
	role: "user" | "assistant"
	text: string
}

type Props = {
	onMatch: () => void
	onReset?: () => void
}

const DEFAULT_PROMPT = "szukam działki w Zwierzyńcu w Krakowie"
const TYPING_SPEED_MS = 55
const TYPING_START_DELAY_MS = 600
const AUTO_SEND_DELAY_MS = 650

export function detectPlotQuery(text: string): boolean {
	const t = text.toLowerCase()
	const hasPlot = /dzia[łl]k|parcel|plot/.test(t)
	const hasZwierzyniec = /zwierzy[nń]/.test(t)
	return hasPlot && hasZwierzyniec
}

export default function PromptPanel({ onMatch, onReset }: Props) {
	const [input, setInput] = useState("")
	const [messages, setMessages] = useState<Message[]>([])
	const [busy, setBusy] = useState(false)
	const [isTyping, setIsTyping] = useState(false)
	const hasAutoRunRef = useRef(false)
	const inputRef = useRef<HTMLInputElement | null>(null)

	const send = useCallback(
		(raw?: string) => {
			const text = (raw ?? input).trim()
			if (!text || busy) {
				return
			}

			setMessages((prev) => [...prev, { role: "user", text }])
			setInput("")
			setBusy(true)

			window.setTimeout(() => {
				if (detectPlotQuery(text)) {
					setMessages((prev) => [
						...prev,
						{
							role: "assistant",
							text: "Znaleziono 2 dopasowania. Zaznaczam działki w dzielnicy Zwierzyniec na mapie."
						}
					])
					onMatch()
				} else {
					setMessages((prev) => [
						...prev,
						{
							role: "assistant",
							text: "Nie znalazłem pasujących działek dla tego zapytania."
						}
					])
				}
				setBusy(false)
			}, 700)
		},
		[busy, input, onMatch]
	)

	useEffect(() => {
		if (hasAutoRunRef.current) {
			return
		}
		hasAutoRunRef.current = true

		const timers: number[] = []
		timers.push(
			window.setTimeout(() => {
				setIsTyping(true)
				inputRef.current?.focus()

				for (let i = 1; i <= DEFAULT_PROMPT.length; i += 1) {
					timers.push(
						window.setTimeout(() => {
							setInput(DEFAULT_PROMPT.slice(0, i))
						}, i * TYPING_SPEED_MS)
					)
				}

				timers.push(
					window.setTimeout(
						() => {
							setIsTyping(false)
							send(DEFAULT_PROMPT)
						},
						DEFAULT_PROMPT.length * TYPING_SPEED_MS + AUTO_SEND_DELAY_MS
					)
				)
			}, TYPING_START_DELAY_MS)
		)

		return () => {
			timers.forEach((id) => window.clearTimeout(id))
		}
	}, [send])

	function clear() {
		setMessages([])
		setInput("")
		onReset?.()
	}

	return (
		<aside className="flex h-full w-full flex-col rounded-xl border border-gray-700 bg-[#0b0e14]/90 p-4 text-zinc-100">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold tracking-wide">Asystent AirCast</h2>
				{messages.length > 0 ? (
					<button
						type="button"
						onClick={clear}
						className="text-[11px] text-zinc-400 transition hover:text-zinc-200"
					>
						Wyczyść
					</button>
				) : null}
			</div>
			<p className="mt-1 text-xs text-zinc-400">Zapytaj o działki lub stacje pomiarowe.</p>

			<div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
				{messages.length === 0 ? (
					<p className="text-zinc-500">
						Przykład: <span className="text-zinc-300">&quot;{DEFAULT_PROMPT}&quot;</span>
					</p>
				) : null}
				{messages.map((msg, idx) => (
					<div
						key={idx}
						className={`rounded-lg border px-3 py-2 ${
							msg.role === "user"
								? "border-lime-400/40 bg-lime-400/10 text-zinc-100"
								: "border-zinc-700 bg-zinc-900/80 text-zinc-200"
						}`}
					>
						<p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
							{msg.role === "user" ? "Ty" : "Asystent"}
						</p>
						<p className="whitespace-pre-wrap leading-snug">{msg.text}</p>
					</div>
				))}
				{busy ? <p className="text-[11px] italic text-zinc-500">Szukam...</p> : null}
			</div>

			<div className="mt-3 flex gap-2">
				<div className="relative flex-1">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								send()
							}
						}}
						readOnly={isTyping}
						placeholder="Wpisz zapytanie..."
						className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 pr-6 text-sm text-zinc-100 outline-none focus:border-lime-400"
						aria-label="Zapytanie do asystenta"
					/>
					{isTyping ? (
						<span
							aria-hidden="true"
							className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 animate-pulse text-sm text-lime-300"
						>
							▍
						</span>
					) : null}
				</div>
				<button
					type="button"
					onClick={() => send()}
					disabled={busy || isTyping || input.trim().length === 0}
					className="rounded-md border border-lime-400/60 bg-lime-400/20 px-3 py-2 text-xs font-medium text-lime-200 transition hover:bg-lime-400/30 disabled:opacity-50"
				>
					Wyślij
				</button>
			</div>
		</aside>
	)
}
