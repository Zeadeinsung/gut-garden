import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GardenState } from '@/types/garden'

interface GardenStore {
  currentState: GardenState
  moistureLevel: number
  gardenLevel: number
  gardenXp: number
  interactionCount: number
  setState: (s: GardenState) => void
  addInteraction: () => void
  addXp: (xp: number) => void
}

export const useGardenStore = create<GardenStore>()(
  persist(
    (set) => ({
      currentState: 'healthy',
      moistureLevel: 50,
      gardenLevel: 1,
      gardenXp: 0,
      interactionCount: 0,
      setState: (s) => set({ currentState: s }),
      addInteraction: () => set((st) => ({ interactionCount: st.interactionCount + 1 })),
      addXp: (xp) => set((st) => ({ gardenXp: st.gardenXp + xp })),
    }),
    { name: 'gg-garden' }
  )
)
