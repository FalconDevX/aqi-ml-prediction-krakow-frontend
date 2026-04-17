import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MapOptionsPanel from "./MapOptionsPanel"

describe("MapOptionsPanel", () => {
	it("renderuje nagłówek i opis panelu", () => {
		render(<MapOptionsPanel selectedMetric="default" onMetricChange={() => {}} />)
		expect(screen.getByText("Opcje mapy")).toBeInTheDocument()
		expect(screen.getByText("Lista parametrow")).toBeInTheDocument()
	})

	it("renderuje wszystkie metryki jako opcje selecta", () => {
		render(<MapOptionsPanel selectedMetric="default" onMetricChange={() => {}} />)
		const select = screen.getByLabelText("Wybierz parametr mapy") as HTMLSelectElement
		expect(select.options).toHaveLength(13)
		expect(select.value).toBe("default")
	})

	it("odzwierciedla wybraną metrykę w selectcie", () => {
		render(<MapOptionsPanel selectedMetric="pm25" onMetricChange={() => {}} />)
		const select = screen.getByLabelText("Wybierz parametr mapy") as HTMLSelectElement
		expect(select.value).toBe("pm25")
	})

	it("wywołuje onMetricChange po zmianie wartości", async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		render(<MapOptionsPanel selectedMetric="default" onMetricChange={onChange} />)

		const select = screen.getByLabelText("Wybierz parametr mapy")
		await user.selectOptions(select, "pm10")

		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith("pm10")
	})
})
