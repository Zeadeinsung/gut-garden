import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDemoStore } from '@/stores/demoStore'
import { api } from '@/lib/api'
import type { UserData } from '@/types/user'

interface AuthCtx {
  guestLogin: (childName: string) => void
  sendCode: (phone: string) => Promise<void>
  verifyCode: (phone: string, code: string) => Promise<void>
  logout: () => void
  migrateGuest: (payload: Record<string, unknown>) => Promise<void>
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)
export const useAuth = () => useContext(AuthContext)

interface LoginData {
  token: string
  user: UserData
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore()

  // Initialize guest mode on first visit
  useEffect(() => {
    if (!store.mode) {
      store.setMode('guest')
    }
  }, [])

  // 启动时若已是注册态，刷新 /auth/me 校正 active_child_id
  // （种子重跑或数据重置后，本地持久化的 child_id 可能已失效）
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (store.mode !== 'registered' || !token) return
    let cancelled = false
    api
      .get<UserData>('/auth/me')
      .then((user) => {
        if (!cancelled) store.setUser(user)
      })
      .catch(() => {
        // token 失效由 api 统一跳转登录页
      })
    return () => {
      cancelled = true
    }
  }, [store.mode])

  const guestLogin = (childName: string) => {
    store.setUser({
      parent_id: 0,
      phone: '',
      children: [{ id: 1, name: childName, age: 6, avatar_url: null }],
      active_child_id: 1,
    })
    store.setMode('guest')
  }

  const sendCode = async (phone: string) => {
    const data = await api.post<{ sent: boolean; code?: string }>('/auth/send-code', { phone })
    if (data.code) useDemoStore.getState().addCode(phone, data.code)
  }

  const verifyCode = async (phone: string, code: string) => {
    const data = await api.post<LoginData>('/auth/verify-code', { phone, code })
    store.setToken(data.token)
    store.setUser(data.user)
    store.setMode('registered')
    localStorage.setItem('token', data.token)
  }

  const migrateGuest = async (payload: Record<string, unknown>) => {
    await api.post('/auth/migrate', payload)
  }

  const logout = () => {
    store.logout()
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ guestLogin, sendCode, verifyCode, logout, migrateGuest }}>
      {children}
    </AuthContext.Provider>
  )
}
