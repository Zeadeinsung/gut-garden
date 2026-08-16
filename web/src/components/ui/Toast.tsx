import { useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

let toastId = 0
let addToastFn: ((t: ToastItem) => void) | null = null

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  addToastFn?.({ id: ++toastId, message, type })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((t: ToastItem) => {
    setToasts((prev) => [...prev, t])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3000)
  }, [])

  useEffect(() => { addToastFn = addToast; return () => { addToastFn = null } }, [addToast])

  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-garden-mascot' }

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-xl shadow-lg animate-slide-in`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
