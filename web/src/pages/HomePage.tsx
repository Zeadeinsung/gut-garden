import { useNavigate } from 'react-router-dom'
import { useCheckinStore } from '@/stores/checkinStore'
import { useGardenStore } from '@/stores/gardenStore'
import { useAuthStore } from '@/stores/authStore'
import { ProgressBar } from '@/components/ui/ProgressBar'

const MENUS = [
  { path: '/garden', label: '探索花园', icon: '🌱', desc: '喂食、互动' },
  { path: '/checkin', label: '每日打卡', icon: '✅', desc: '5项健康任务' },
  { path: '/classroom', label: '肠道课堂', icon: '📖', desc: '趣味知识' },
  { path: '/stool', label: '便便日记', icon: '💩', desc: '记录观察' },
  { path: '/badges', label: '成长徽章', icon: '🏅', desc: '成就收集' },
  { path: '/profile', label: '宝宝信息', icon: '👤', desc: '设置管理' },
]

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { today, streak } = useCheckinStore()
  const { gardenLevel, gardenXp } = useGardenStore()

  const childName = user?.children.find((c) => c.id === user.active_child_id)?.name ?? '宝宝'
  const todayKey = getTodayKey()
  const doneCount = today && today.date === todayKey
    ? today.tasks.filter((t) => t.status === 'done' || t.status === 'makeup').length
    : 0
  const xpForLevel = gardenLevel * 100
  const xpProgress = gardenXp % 100

  return (
    <div className="flex flex-col h-full pb-20 px-4">
      {/* Greeting */}
      <div className="py-6 text-center">
        <h1 className="text-3xl font-bold text-garden-forest">
          你好，{childName}！
        </h1>
        <p className="text-gray-400 mt-1">今天也要好好照顾肠道花园哦</p>
      </div>

      {/* Status cards */}
      <div className="flex gap-3 max-w-sm mx-auto w-full mb-6">
        <div className="flex-1 bg-white/60 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-garden-forest">{streak}</p>
          <p className="text-xs text-gray-400">连续打卡</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-garden-gold">Lv.{gardenLevel}</p>
          <p className="text-xs text-gray-400">花园等级</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-garden-water">{doneCount}/5</p>
          <p className="text-xs text-gray-400">今日打卡</p>
        </div>
      </div>

      {/* XP bar */}
      <div className="max-w-sm mx-auto w-full mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>经验值</span>
          <span>{xpProgress}/{xpForLevel}</span>
        </div>
        <ProgressBar value={xpProgress} max={xpForLevel} color="bg-garden-gold" />
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto w-full">
        {MENUS.map((m) => (
          <button
            key={m.path}
            className="bg-white/60 backdrop-blur rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm hover:scale-105 transition-transform active:scale-95"
            onClick={() => navigate(m.path)}
          >
            <span className="text-3xl">{m.icon}</span>
            <span className="font-bold text-sm text-gray-700">{m.label}</span>
            <span className="text-[10px] text-gray-400">{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
