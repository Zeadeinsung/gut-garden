import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KnowledgeModule, KnowledgeCard, QuizQuestion } from '@/types/classroom'

interface ClassroomStore {
  modules: KnowledgeModule[]
  currentCard: KnowledgeCard | null
  currentQuiz: QuizQuestion | null
  quizScore: number
  setModules: (m: KnowledgeModule[]) => void
  setCurrentCard: (c: KnowledgeCard | null) => void
  setCurrentQuiz: (q: QuizQuestion | null) => void
  setQuizScore: (s: number) => void
}

export const useClassroomStore = create<ClassroomStore>()(
  persist(
    (set) => ({
      modules: [],
      currentCard: null,
      currentQuiz: null,
      quizScore: 0,
      setModules: (m) => set({ modules: m }),
      setCurrentCard: (c) => set({ currentCard: c }),
      setCurrentQuiz: (q) => set({ currentQuiz: q }),
      setQuizScore: (s) => set({ quizScore: s }),
    }),
    { name: 'gg-classroom' }
  )
)
