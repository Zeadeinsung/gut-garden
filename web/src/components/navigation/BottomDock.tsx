import { NavLink } from 'react-router-dom'

interface Tab {
  to: string
  label: string
  icon: string
}

const tabs: Tab[] = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/garden', label: '花园', icon: '🌱' },
  { to: '/checkin', label: '打卡', icon: '✅' },
  { to: '/stool', label: '便便', icon: '💩' },
  { to: '/classroom', label: '课堂', icon: '📖' },
  { to: '/badges', label: '徽章', icon: '🏅' },
  { to: '/profile', label: '我的', icon: '👤' },
]

export default function BottomDock() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-garden-cream shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors duration-200 min-w-0 ${
                isActive
                  ? 'text-garden-forest bg-garden-cream'
                  : 'text-gray-400 hover:text-garden-forest/70'
              }`
            }
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] leading-none font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
