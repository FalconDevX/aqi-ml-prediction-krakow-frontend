import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MapOptionsPanel from "./MapOptionsPanel"

const defaultProps = {
	selectedMetric: "default" as const,
	onMetricChange: () => {},
	geospatialApprox: false,
	onGeospatialApproxChange: () => {}
}

describe("MapOptionsPanel", () => {
	it("renderuje nagłówek i opis panelu", () => {
		render(<MapOptionsPanel {...defaultProps} />)
		expect(screen.getByText("Opcje mapy")).toBeInTheDocument()
		expect(screen.getByText("Lista parametrow")).toBeInTheDocument()
	})

	it("renderuje wszystkie metryki jako opcje selecta", () => {
		render(<MapOptionsPanel {...defaultProps} />)
		const select = screen.getByLabelText("Wybierz parametr mapy") as HTMLSelectElement
		expect(select.options).toHaveLength(13)
		expect(select.value).toBe("default")
	})

	it("odzwierciedla wybraną metrykę w selectcie", () => {
		render(<MapOptionsPanel {...defaultProps} selectedMetric="pm25" />)
		const select = screen.getByLabelText("Wybierz parametr mapy") as HTMLSelectElement
		expect(select.value).toBe("pm25")
	})

	it("wywołuje onMetricChange po zmianie wartości", async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		render(<MapOptionsPanel {...defaultProps} onMetricChange={onChange} />)

		const select = screen.getByLabelText("Wybierz parametr mapy")
		await user.selectOptions(select, "pm10")

		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith("pm10")
	})

	it("pokazuje skalę kolorów dla metryki z normą", () => {
		render(<MapOptionsPanel {...defaultProps} selectedMetric="pm25" />)
		expect(screen.getByText(/Skala pm25/i)).toBeInTheDocument()
	})

	it("wywołuje onGeospatialApproxChange po zaznaczeniu checkboxa", async () => {
		const user = userEvent.setup()
		const onGeospatialApproxChange = vi.fn()
		render(
			<MapOptionsPanel
				{...defaultProps}
				selectedMetric="pm25"
				onGeospatialApproxChange={onGeospatialApproxChange}
			/>
		)

		const checkbox = screen.getByRole("checkbox", { name: /Aproksymacja geoprzestrzenna/i })
		await user.click(checkbox)

		expect(onGeospatialApproxChange).toHaveBeenCalledWith(true)
	})
})
