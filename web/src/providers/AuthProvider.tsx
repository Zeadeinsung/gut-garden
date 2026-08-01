import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'

interface AuthCtx {
  guestLogin: (childName: string) => void
  sendCode: (phone: string) => Promise<void>
  verifyCode: (phone: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore()

  // Initialize guest mode on first visit
  useEffect(() => {
    if (!store.mode) {
      store.setMode('guest')
    }
  }, [])

  const guestLogin = (childName: string) => {
    store.setUser({
      parent_id: 0,
      phone: '',
      children: [
        { id: 1, name: childName, age: 6, avatar_url: null },
      ],
      active_child_id: 1,
    })
    store.setMode('guest')
  }

  const sendCode = async (phone: string) => {
    await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
  }

  const verifyCode = async (phone: string, code: string) => {
    const resp = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    const data = await resp.json()
    if (data.token && data.user) {
      store.setToken(data.token)
      store.setUser(data.user)
      store.setMode('registered')
      localStorage.setItem('token', data.token)
    }
  }

  const logout = () => {
    store.logout()
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ guestLogin, sendCode, verifyCode, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
