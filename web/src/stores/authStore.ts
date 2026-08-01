import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserData } from '@/types/user'

type AuthMode = 'guest' | 'registered'

interface AuthStore {
  mode: AuthMode
  user: UserData | null
  token: string | null
  loading: boolean
  setMode: (m: AuthMode) => void
  setUser: (u: UserData | null) => void
  setToken: (t: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      mode: 'guest',
      user: null,
      token: null,
      loading: false,
      setMode: (m) => set({ mode: m }),
      setUser: (u) => set({ user: u }),
      setToken: (t) => set({ token: t }),
      logout: () => set({ mode: 'guest', user: null, token: null }),
    }),
    { name: 'gg-auth' }
  )
)
