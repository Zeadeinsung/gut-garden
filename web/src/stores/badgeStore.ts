import { create } from 'zustand'

interface Badge { id: number; code: string; name: string; rarity: string; awarded_at: string }

interface BadgeStore {
  awarded: Badge[]
  pending: Badge[]
  setAwarded: (b: Badge[]) => void
  setPending: (b: Badge[]) => void
}

export const useBadgeStore = create<BadgeStore>((set) => ({
  awarded: [],
  pending: [],
  setAwarded: (b) => set({ awarded: b }),
  setPending: (b) => set({ pending: b }),
}))
