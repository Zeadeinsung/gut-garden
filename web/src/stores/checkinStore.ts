import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyCheckin } from '@/types/checkin'

interface CheckinStore {
  today: DailyCheckin | null
  streak: number
  makeupsUsed: number
  setToday: (t: DailyCheckin) => void
  setStreak: (n: number) => void
  useMakeup: () => boolean
}

export const useCheckinStore = create<CheckinStore>()(
  persist(
    (set, get) => ({
      today: null,
      streak: 0,
      makeupsUsed: 0,
      setToday: (t) => set({ today: t }),
      setStreak: (n) => set({ streak: n }),
      useMakeup: () => {
        const { makeupsUsed } = get()
        if (makeupsUsed >= 3) return false
        set({ makeupsUsed: makeupsUsed + 1 })
        return true
      },
    }),
    { name: 'gg-checkin' }
  )
)
