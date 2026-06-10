"use client"

import LoginPanel from "@/components/auth/LoginPanel"
import RegisterPanel from "@/components/auth/RegisterPanel"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

type AuthView = "login" | "register" | null

export default function Header() {
	const [authView, setAuthView] = useState<AuthView>(null)

	return (
		<>
			<header className="sticky top-0 z-50 flex h-[50px] w-full items-center bg-zinc-900">
				<Link href="/" className="ml-4 shrink-0" aria-label="Strona główna AirCast">
					<Image
						src="/AirCast.png"
						alt="AirCast"
						width={140}
						height={40}
						className="h-10 w-auto object-contain object-left brightness-0 invert"
						priority
					/>
				</Link>

				<nav className="ml-auto mr-4 flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="border-lime-700/80 bg-transparent text-lime-300 hover:border-lime-600 hover:bg-lime-950/80 hover:text-lime-200"
						onClick={() => setAuthView("login")}
					>
						Logowanie
					</Button>
					<Button
						type="button"
						size="sm"
						className="bg-lime-500 text-zinc-950 hover:bg-lime-400"
						onClick={() => setAuthView("register")}
					>
						Rejestracja
					</Button>
				</nav>
			</header>

			{authView === "login" ? (
				<LoginPanel
					onClose={() => setAuthView(null)}
					onSwitchToRegister={() => setAuthView("register")}
				/>
			) : null}

			{authView === "register" ? (
				<RegisterPanel
					onClose={() => setAuthView(null)}
					onSwitchToLogin={() => setAuthView("login")}
				/>
			) : null}
		</>
	)
}
