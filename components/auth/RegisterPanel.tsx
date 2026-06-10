"use client"

import { Button } from "@/components/ui/button"
import AuthModal from "@/components/auth/AuthModal"
import { validateRegisterInput, type AuthFormStatus } from "@/components/auth/authForm"
import { useState } from "react"

type Props = {
	onClose: () => void
	onSwitchToLogin: () => void
}

const inputClassName =
	"w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-600"

export default function RegisterPanel({ onClose, onSwitchToLogin }: Props) {
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [status, setStatus] = useState<AuthFormStatus>({ type: "idle" })

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const validationError = validateRegisterInput(email, password, confirmPassword)
		if (validationError) {
			setStatus({ type: "error", message: validationError })
			return
		}

		setStatus({
			type: "success",
			message: "Rejestracja będzie dostępna po podłączeniu API użytkowników."
		})
	}

	return (
		<AuthModal title="Rejestracja" onClose={onClose}>
			<form className="space-y-4" onSubmit={handleSubmit}>
				<label className="block space-y-1.5 text-sm text-zinc-300">
					<span>Nazwa użytkownika</span>
					<input
						type="text"
						autoComplete="name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						className={inputClassName}
						placeholder="Jan Kowalski"
					/>
				</label>

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
						autoComplete="new-password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className={inputClassName}
						placeholder="min. 8 znaków"
					/>
				</label>

				<label className="block space-y-1.5 text-sm text-zinc-300">
					<span>Powtórz hasło</span>
					<input
						type="password"
						autoComplete="new-password"
						value={confirmPassword}
						onChange={(event) => setConfirmPassword(event.target.value)}
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
					Utwórz konto
				</Button>
			</form>

			<p className="mt-4 text-center text-xs text-zinc-500">
				Masz już konto?{" "}
				<button
					type="button"
					onClick={onSwitchToLogin}
					className="cursor-pointer text-lime-500 transition hover:text-lime-400"
				>
					Zaloguj się
				</button>
			</p>
		</AuthModal>
	)
}
