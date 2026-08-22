import { create } from 'zustand'

interface DemoCode {
  phone: string
  code: string
  at: number
}

interface DemoStore {
  codes: DemoCode[]
  addCode: (phone: string, code: string) => void
  removeCode: (at: number) => void
  clearCodes: () => void
}

export const useDemoStore = create<DemoStore>((set) => ({
  codes: [],
  addCode: (phone, code) => set((s) => ({ codes: [{ phone, code, at: Date.now() }, ...s.codes].slice(0, 5) })),
  removeCode: (at) => set((s) => ({ codes: s.codes.filter((c) => c.at !== at) })),
  clearCodes: () => set({ codes: [] }),
}))
