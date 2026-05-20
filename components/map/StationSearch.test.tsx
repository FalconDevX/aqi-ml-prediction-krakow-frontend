import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import StationSearch from "./StationSearch"
import type { StationRecord } from "@/lib/stations"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush })
}))

const sampleStations: StationRecord[] = [
	{
		id: 58,
		name: "Józefa Dietla",
		lat: 50.05,
		long: 19.94,
		district: "Stare Miasto",
		idStr: "58",
		color: "#84cc16"
	},
	{
		id: 65989,
		name: "Rynek Główny",
		lat: 50.06,
		long: 19.93,
		district: "Stare Miasto",
		idStr: "65989",
		color: "#84cc16"
	}
]

describe("StationSearch", () => {
	it("renderuje pole wyszukiwania", () => {
		render(<StationSearch stations={sampleStations} query="" onQueryChange={() => {}} />)
		expect(screen.getByLabelText("Szukaj stacji")).toBeInTheDocument()
	})

	it("pokazuje wyniki i wywołuje onQueryChange", async () => {
		const user = userEvent.setup()
		const onQueryChange = vi.fn()
		render(<StationSearch stations={sampleStations} query="Rynek" onQueryChange={onQueryChange} />)

		expect(screen.getByText("Rynek Główny")).toBeInTheDocument()

		const input = screen.getByLabelText("Szukaj stacji")
		await user.clear(input)
		await user.type(input, "Diet")
		expect(onQueryChange).toHaveBeenCalled()
	})

	it("nawiguje do stacji po kliknięciu wyniku", async () => {
		const user = userEvent.setup()
		mockPush.mockClear()
		render(<StationSearch stations={sampleStations} query="Rynek" onQueryChange={() => {}} />)

		await user.click(screen.getByRole("option", { name: /Rynek Główny/i }))
		expect(mockPush).toHaveBeenCalledWith("/stations/65989")
	})
})
