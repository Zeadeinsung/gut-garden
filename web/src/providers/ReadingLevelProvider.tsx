import { createContext, useContext } from 'react'
import { useUIStore } from '@/stores/uiStore'
import type { ReadingLevel } from '@/types/user'

const ReadingLevelContext = createContext<{
  level: ReadingLevel
  setLevel: (l: ReadingLevel) => void
}>({} as ReturnType<typeof useReadingLevel>)

function useReadingLevel() {
  const level = useUIStore((s) => s.readingLevel)
  const setLevel = useUIStore((s) => s.setReadingLevel)
  return { level, setLevel }
}

export const useReadingLevelCtx = () => useContext(ReadingLevelContext)

export function ReadingLevelProvider({ children }: { children: React.ReactNode }) {
  const ctx = useReadingLevel()
  return (
    <ReadingLevelContext.Provider value={ctx}>
      {children}
    </ReadingLevelContext.Provider>
  )
}
