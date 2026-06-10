"use client"

import { Button } from "@/components/ui/button"
import AuthModal from "@/components/auth/AuthModal"
import { validateLoginInput, type AuthFormStatus } from "@/components/auth/authForm"
import { useState } from "react"

type Props = {
	onClose: () => void
	onSwitchToRegister: () => void
}

const inputClassName =
	"w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-600"

export default function LoginPanel({ onClose, onSwitchToRegister }: Props) {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [status, setStatus] = useState<AuthFormStatus>({ type: "idle" })

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const validationError = validateLoginInput(email, password)
		if (validationError) {
			setStatus({ type: "error", message: validationError })
			return
		}

		setStatus({
			type: "success",
			message: "Logowanie będzie dostępne po podłączeniu API użytkowników."
		})
	}

	return (
		<AuthModal title="Logowanie" onClose={onClose}>
			<form className="space-y-4" onSubmit={handleSubmit}>
				<label className="block space-y-1.5 text-sm text-zinc-300">
					<span>E-mail</span>
					<input
						type="email"
						autoComplete="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className={inputClassName}
						placeholder="twoj@email.pl"
					/>
				</label>

				<label className="block space-y-1.5 text-sm text-zinc-300">
					<span>Hasło</span>
					<input
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className={inputClassName}
						placeholder="••••••••"
					/>
				</label>

				{status.message ? (
					<p
						role={status.type === "error" ? "alert" : "status"}
						className={
							status.type === "error"
								? "text-xs text-red-400"
								: "text-xs text-lime-500/90"
						}
					>
						{status.message}
					</p>
				) : null}

				<Button
					type="submit"
					className="w-full bg-lime-600 text-zinc-950 hover:bg-lime-500"
				>
					Zaloguj się
				</Button>
			</form>

			<p className="mt-4 text-center text-xs text-zinc-500">
				Nie masz konta?{" "}
				<button
					type="button"
					onClick={onSwitchToRegister}
					className="cursor-pointer text-lime-500 transition hover:text-lime-400"
				>
					Zarejestruj się
				</button>
			</p>
		</AuthModal>
	)
}
