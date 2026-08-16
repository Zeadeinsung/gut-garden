import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ReadingLevelProvider } from '@/providers/ReadingLevelProvider'
import { ToastContainer } from '@/components/ui/Toast'
import { useUIStore } from '@/stores/uiStore'
import { useApiSync } from '@/hooks/useApiSync'
import BottomDock from '@/components/navigation/BottomDock'

const StoolModal = lazy(() => import('@/components/modals/StoolModal'))
const AIChatModal = lazy(() => import('@/components/modals/AIChatModal'))
const OnboardingOverlay = lazy(() => import('@/components/onboarding/OnboardingOverlay'))

export default function Layout() {
  const location = useLocation()
  const sceneWallpapers: Record<string, string> = {
    '/': '/assets/scenes/scene_home_bg.png',
    '/checkin': '/assets/scenes/scene_checkin_bg.png',
    '/badges': '/assets/scenes/scene_badge_bg.jpg',
    '/garden': '/assets/scenes/scene_garden_bg.png',
    '/classroom': '/assets/scenes/scene_classroom_map.png',
  }
  const wallpaper = sceneWallpapers[location.pathname]
  const stoolModalOpen = useUIStore((s) => s.stoolModalOpen)
  const aiChatOpen = useUIStore((s) => s.aiChatOpen)
  const onboardingComplete = useUIStore((s) => s.onboardingComplete)
  const editing = useUIStore((s) => s.editing)
  const toggleEditing = useUIStore((s) => s.toggleEditing)
  useApiSync()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault()
        toggleEditing()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleEditing])

  return (
    <ReadingLevelProvider>
      <div className="h-screen flex items-center justify-center bg-garden-mascot p-4">
        <div
          className={`relative overflow-hidden rounded-[2rem] shadow-2xl w-[min(calc(100vw-2rem),calc((100vh-2rem)*16/10))] h-[min(calc(100vh-2rem),calc((100vw-2rem)*10/16))] ${wallpaper ? '' : 'bg-garden-cream'}`}
          style={wallpaper ? {
            backgroundImage: `url(${wallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
          } : undefined}
        >
          <div className="w-full h-full flex flex-col">
            {/* Global edit mode banner */}
            {editing && (
              <div className="bg-garden-coral/90 text-white text-[11px] text-center py-0.5 font-medium flex items-center justify-center gap-3 shrink-0">
                <span>Edit Mode — Ctrl+E to exit</span>
              </div>
            )}
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
            <BottomDock />
          </div>

          <ToastContainer />

          {stoolModalOpen && (
            <Suspense fallback={null}>
              <StoolModal />
            </Suspense>
          )}

          {aiChatOpen && (
            <Suspense fallback={null}>
              <AIChatModal />
            </Suspense>
          )}

          {!onboardingComplete && (
            <Suspense fallback={null}>
              <OnboardingOverlay />
            </Suspense>
          )}
        </div>
      </div>
    </ReadingLevelProvider>
  )
}
