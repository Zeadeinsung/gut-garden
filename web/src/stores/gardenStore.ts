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
      gardenLevel: 5, // TEMP(预览): 丰收期效果，接入计算系统后改回 1
      gardenXp: 0,
      interactionCount: 0,
      setState: (s) => set({ currentState: s }),
      addInteraction: () => set((st) => ({ interactionCount: st.interactionCount + 1 })),
      addXp: (xp) => set((st) => ({ gardenXp: st.gardenXp + xp })),
    }),
    {
      name: 'gg-garden',
      // TEMP(预览): 强制显示丰收期(gardenLevel=5)看效果，接入计算系统后移除。
      // 注意 current 先展开、persisted 后展开，避免默认值覆盖已保存的 gardenXp。
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<GardenStore>),
        gardenLevel: 5,
      }),
    }
  )
)
