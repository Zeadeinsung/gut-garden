import { useNavigate } from 'react-router-dom'

const MENUS = [
  { path: '/garden', label: '探索花园', icon: '🌱' },
  { path: '/checkin', label: '每日打卡', icon: '✅' },
  { path: '/badges', label: '成长徽章', icon: '🏅' },
  { path: '/report', label: '我的报告', icon: '📊' },
]

export default function HomePage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="grid grid-cols-2 gap-4">
        {MENUS.map((m) => (
          <button
            key={m.path}
            className="w-40 h-40 bg-white/60 backdrop-blur rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform"
            onClick={() => navigate(m.path)}
          >
            <span className="text-4xl">{m.icon}</span>
            <span className="font-bold text-gray-700">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
