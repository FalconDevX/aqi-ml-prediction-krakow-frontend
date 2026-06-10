import { describe, expect, it } from "vitest"
import { validateLoginInput, validateRegisterInput } from "@/components/auth/authForm"

describe("authForm validation", () => {
	it("accepts valid login input", () => {
		expect(validateLoginInput("user@example.com", "secret")).toBeNull()
	})

	it("rejects invalid email on login", () => {
		expect(validateLoginInput("not-an-email", "secret")).toMatch(/e-mail/)
	})

	it("requires matching passwords on register", () => {
		expect(validateRegisterInput("user@example.com", "password1", "password2")).toMatch(
			/identyczne/
		)
	})

	it("requires minimum password length on register", () => {
		expect(validateRegisterInput("user@example.com", "short", "short")).toMatch(/8 znak/)
	})
})
