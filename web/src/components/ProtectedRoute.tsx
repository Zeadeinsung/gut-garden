import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui/Spinner'

interface ProtectedRouteProps {
  requireRegistered?: boolean
}

export default function ProtectedRoute({ requireRegistered = false }: ProtectedRouteProps) {
  const mode = useAuthStore((s) => s.mode)
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-garden-cream">
        <Spinner />
      </div>
    )
  }

  // No active session (fresh visitor) → land on the login page first
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireRegistered && mode !== 'registered') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
