import { Outlet } from 'react-router-dom'
import { ReadingLevelProvider } from '@/providers/ReadingLevelProvider'
import { ToastContainer } from '@/components/ui/Toast'

export default function Layout() {
  return (
    <ReadingLevelProvider>
      <div className="flex flex-col h-screen bg-garden-cream">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <ToastContainer />
      </div>
    </ReadingLevelProvider>
  )
}
