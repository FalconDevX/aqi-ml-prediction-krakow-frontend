export type AuthFormStatus = {
	type: "idle" | "error" | "success"
	message?: string
}

export function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validateLoginInput(email: string, password: string): string | null {
	if (!email.trim()) {
		return "Podaj adres e-mail."
	}
	if (!isValidEmail(email)) {
		return "Podaj poprawny adres e-mail."
	}
	if (!password) {
		return "Podaj hasło."
	}
	return null
}

export function validateRegisterInput(
	email: string,
	password: string,
	confirmPassword: string
): string | null {
	const loginError = validateLoginInput(email, password)
	if (loginError) {
		return loginError
	}
	if (password.length < 8) {
		return "Hasło musi mieć co najmniej 8 znaków."
	}
	if (password !== confirmPassword) {
		return "Hasła nie są identyczne."
	}
	return null
}
