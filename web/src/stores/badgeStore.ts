import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BadgeAward, BadgeDef } from '@/types/badges'

interface BadgeStore {
  awarded: BadgeAward[]
  pending: BadgeAward[]
  defs: BadgeDef[]
  setAwarded: (b: BadgeAward[]) => void
  setPending: (b: BadgeAward[]) => void
  setDefs: (d: BadgeDef[]) => void
  addAward: (b: BadgeAward) => void
}

export const useBadgeStore = create<BadgeStore>()(
  persist(
    (set) => ({
      awarded: [],
      pending: [],
      defs: [],
      setAwarded: (b) => set({ awarded: b }),
      setPending: (b) => set({ pending: b }),
      setDefs: (d) => set({ defs: d }),
      addAward: (b) => set((s) => ({ awarded: [...s.awarded, b] })),
    }),
    { name: 'gg-badges' }
  )
)
