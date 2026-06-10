"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

type Props = {
	title: string
	onClose: () => void
	children: ReactNode
}

export default function AuthModal({ title, onClose, children }: Props) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose()
			}
		}
		document.addEventListener("keydown", onKeyDown)
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.removeEventListener("keydown", onKeyDown)
			document.body.style.overflow = previousOverflow
		}
	}, [onClose])

	if (!mounted) {
		return null
	}

	return createPortal(
		<div
			className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					onClose()
				}
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="auth-modal-title"
				className="relative z-[10001] w-full max-w-md rounded-2xl border border-zinc-700/90 bg-zinc-900 p-5 shadow-2xl"
			>
				<div className="mb-4 flex items-start justify-between gap-3">
					<h2 id="auth-modal-title" className="text-base font-semibold tracking-wide text-zinc-100">
						{title}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-md px-2 py-1 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-lime-300"
						aria-label="Zamknij"
					>
						×
					</button>
				</div>
				{children}
			</div>
		</div>,
		document.body
	)
}
