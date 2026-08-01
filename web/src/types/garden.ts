export type GardenState = 'healthy' | 'high_sugar' | 'dry' | 'recovering'
export type GardenStage = 1 | 2 | 3 | 4 | 5 | 6

export interface POI {
  id: string
  name: string
  x: number
  y: number
  unlocked: boolean
}

export interface GardenStateData {
  currentState: GardenState
  moistureLevel: number
  gardenLevel: number
  gardenXp: number
  interactionCount: number
}
