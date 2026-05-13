export type ValueScaleStop = {
	until: number
	color: string
	key: string
}

export type ValueColorScale = {
	id: string
	unitLabel: string
	stops: ValueScaleStop[]
}
