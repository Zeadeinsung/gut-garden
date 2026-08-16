import { create } from 'zustand'
import type { ReadingLevel } from '@/types/user'

interface UIStore {
  readingLevel: ReadingLevel
  sidebarOpen: boolean
  stoolModalOpen: boolean
  celebrationModalOpen: boolean
  aiChatOpen: boolean
  onboardingComplete: boolean
  soundEnabled: boolean
  editing: boolean
  setReadingLevel: (l: ReadingLevel) => void
  toggleSidebar: () => void
  setStoolModalOpen: (o: boolean) => void
  setCelebrationModalOpen: (o: boolean) => void
  setAiChatOpen: (o: boolean) => void
  setOnboardingComplete: (o: boolean) => void
  setSoundEnabled: (o: boolean) => void
  toggleEditing: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  readingLevel: 'child',
  sidebarOpen: false,
  stoolModalOpen: false,
  celebrationModalOpen: false,
  aiChatOpen: false,
  onboardingComplete: !!localStorage.getItem('gg-onboarding-done'),
  soundEnabled: true,
  editing: false,
  setReadingLevel: (l) => set({ readingLevel: l }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setStoolModalOpen: (o) => set({ stoolModalOpen: o }),
  setCelebrationModalOpen: (o) => set({ celebrationModalOpen: o }),
  setAiChatOpen: (o) => set({ aiChatOpen: o }),
  setOnboardingComplete: (o) => {
    if (o) localStorage.setItem('gg-onboarding-done', '1')
    set({ onboardingComplete: o })
  },
  setSoundEnabled: (o) => set({ soundEnabled: o }),
  toggleEditing: () => set((s) => ({ editing: !s.editing })),
}))
