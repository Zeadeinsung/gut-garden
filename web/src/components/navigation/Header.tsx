import type { ReactNode } from 'react'
import { useUIStore } from '@/stores/uiStore'
import TopRightControls from './TopRightControls'

interface HeaderProps {
  leftSlot?: ReactNode
  centerSlot?: ReactNode
  rightSlot?: ReactNode
}

export default function Header({ leftSlot, centerSlot, rightSlot }: HeaderProps) {
  const editing = useUIStore((s) => s.editing)
  return (
    <header className={`sticky top-0 z-30 pt-6 pb-2 bg-transparent ${editing ? 'pointer-events-none' : ''}`}>
      <div className="flex items-center gap-3 h-12 px-4 max-w-[1280px] mx-auto">
        {/* Left slot: w-[232px] — back button + page title or brand logo */}
        <div className="w-[232px] shrink-0 flex items-center h-full">
          {leftSlot}
        </div>

        {/* Center slot: flex-1 — page-specific center content */}
        <div className="flex-1 flex items-center h-full min-w-0">
          {centerSlot}
        </div>

        {/* Right slot: user + sound + settings (uniform across pages) */}
        <div className="shrink-0 flex items-center h-full">
          {rightSlot ?? <TopRightControls />}
        </div>
      </div>
    </header>
  )
}
