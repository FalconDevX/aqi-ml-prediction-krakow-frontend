import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
	it("łączy proste klasy", () => {
		expect(cn("a", "b")).toBe("a b")
	})

	it("ignoruje wartości falsy", () => {
		expect(cn("a", false, null, undefined, "", "b")).toBe("a b")
	})

	it("obsługuje obiekt z warunkami", () => {
		expect(cn("base", { active: true, disabled: false })).toBe("base active")
	})

	it("obsługuje tablicę klas", () => {
		expect(cn(["a", "b"], "c")).toBe("a b c")
	})

	it("scala konfliktujące klasy tailwind (tw-merge)", () => {
		expect(cn("p-2", "p-4")).toBe("p-4")
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
	})

	it("zwraca pusty string dla braku argumentów", () => {
		expect(cn()).toBe("")
	})
})
