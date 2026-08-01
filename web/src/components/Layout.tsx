import { Outlet } from 'react-router-dom'
import { ReadingLevelProvider } from '@/providers/ReadingLevelProvider'
import { ToastContainer } from '@/components/ui/Toast'
import BottomDock from '@/components/navigation/BottomDock'

export default function Layout() {
  return (
    <ReadingLevelProvider>
      <div className="flex flex-col h-screen bg-garden-cream">
        <main className="flex-1 overflow-auto pb-20">
          <Outlet />
        </main>
        <BottomDock />
        <ToastContainer />
      </div>
    </ReadingLevelProvider>
  )
}
