import { UiIcon } from '@/lib/uiIcons'

const ITEMS = [
  { icon: 'droplet', label: '水滴能量', value: 5, color: '#38bdf8' },
  { icon: 'sprout', label: '植物成长', value: 10, color: '#4caf50' },
  { icon: 'starGold', label: '菌群快乐', value: 8, color: '#f5bd35' },
  { icon: 'sun', label: '花园币', value: 5, color: '#fb923c' },
]

export default function DailyReward() {
  const total = ITEMS.reduce((s, i) => s + i.value, 0)
  return (
    <div className="ggc-card bg-[rgba(255,249,226,0.9)] backdrop-blur-md flex flex-col h-full p-4 overflow-hidden">
      <h3 className="text-[16px] font-bold text-gray-700">今日奖励</h3>
      <p className="text-[11px] text-gray-400 mt-0.5">今日获得</p>
      <div className="flex-1 flex flex-col justify-center gap-2 mt-1">
        {ITEMS.map((it) => (
          <div key={it.label} className="flex items-center gap-2.5 bg-white/60 rounded-2xl px-3 py-2 shadow-sm">
            <UiIcon name={it.icon} size={22} />
            <span className="text-[13px] text-gray-600 flex-1">{it.label}</span>
            <span className="text-[13px] font-bold" style={{ color: it.color }}>+{it.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-white/70 flex items-center justify-between px-1">
        <span className="text-[13px] text-gray-500">总计</span>
        <span className="text-[24px] font-extrabold text-green-600 leading-none">+{total}</span>
      </div>
    </div>
  )
}
