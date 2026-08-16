import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { UiIcon } from '@/lib/uiIcons'
import { useUIStore } from '@/stores/uiStore'

interface HeaderProps {
  leftSlot?: ReactNode
  centerSlot?: ReactNode
  userSlot?: ReactNode
  controlsSlot?: ReactNode
  transparent?: boolean
}

function DefaultControls() {
  const { soundEnabled, setSoundEnabled } = useUIStore()
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-2">
      <button
        className="w-11 h-11 rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md hover:bg-[#7A9538] hover:scale-105 active:scale-95 transition-all"
        onClick={() => navigate('/settings')}
        title="设置"
      >
        <UiIcon name="settingsLine" size={20} />
      </button>
      <button
        className="w-11 h-11 rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md hover:bg-[#7A9538] hover:scale-105 active:scale-95 transition-all"
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? '关闭音效' : '开启音效'}
      >
        <UiIcon name={soundEnabled ? 'volumeLine' : 'volumeMuteLine'} size={20} />
      </button>
    </div>
  )
}

export default function Header({ leftSlot, centerSlot, userSlot, controlsSlot, transparent }: HeaderProps) {
  const editing = useUIStore((s) => s.editing)
  return (
    <header className={`sticky top-0 z-30 pt-6 pb-2 ${transparent ? 'bg-transparent' : 'bg-garden-cream/80'} ${editing ? 'pointer-events-none' : ''}`}>
      <div className="flex items-center gap-3 h-12 px-4 max-w-[1280px] mx-auto">
        {/* Left slot: w-[232px] — back button + page title or brand logo */}
        <div className="w-[232px] shrink-0 flex items-center h-full">
          {leftSlot}
        </div>

        {/* Center slot: flex-1 — page-specific center content */}
        <div className="flex-1 flex items-center h-full min-w-0">
          {centerSlot}
        </div>

        {/* User slot: w-[130px] — user mini card */}
        <div className="w-[130px] shrink-0 flex items-center justify-end h-full">
          {userSlot}
        </div>

        {/* Controls slot: w-[130px] — settings + sound */}
        <div className="w-[130px] shrink-0 flex items-center justify-end h-full">
          {controlsSlot ?? <DefaultControls />}
        </div>
      </div>
    </header>
  )
}
