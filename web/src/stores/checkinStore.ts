import { create } from 'zustand'

interface TaskStatus { task_garden: string; task_eat: string; task_eat_content?: string; task_sleep: string; all_completed: boolean }

interface CheckinStore {
  today: TaskStatus | null
  streak: number
  setToday: (t: TaskStatus) => void
  setStreak: (n: number) => void
}

export const useCheckinStore = create<CheckinStore>((set) => ({
  today: null,
  streak: 0,
  setToday: (t) => set({ today: t }),
  setStreak: (n) => set({ streak: n }),
}))
