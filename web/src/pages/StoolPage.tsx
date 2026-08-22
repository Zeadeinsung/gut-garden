import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { UiIcon } from '@/lib/uiIcons'

interface BristolType {
  id: number
  label: string
  icon: string
  desc: string
  health: 'good' | 'ok' | 'bad'
}

const STOOL_PNG: Record<number, string> = {
  1: '/assets/stools/stool_type1_rabbit.webp',
  2: '/assets/stools/stool_type2_grape.webp',
  3: '/assets/stools/stool_type3_corn.webp',
  4: '/assets/stools/stool_type4_banana.webp',
  5: '/assets/stools/stool_type5_icecream.webp',
  6: '/assets/stools/stool_type6_marshmallow.webp',
  7: '/assets/stools/stool_type7_water.webp',
}

const BRISTOL_TYPES: BristolType[] = [
  { id: 1, label: '坚果状', icon: STOOL_PNG[1], desc: '干硬、分散的颗粒', health: 'bad' },
  { id: 2, label: '香肠状', icon: STOOL_PNG[2], desc: '干硬、表面凹凸', health: 'bad' },
  { id: 3, label: '条状有裂痕', icon: STOOL_PNG[3], desc: '表面有裂痕', health: 'ok' },
  { id: 4, label: '香蕉状', icon: STOOL_PNG[4], desc: '光滑柔软像香蕉', health: 'good' },
  { id: 5, label: '软块状', icon: STOOL_PNG[5], desc: '边缘清晰的软块', health: 'ok' },
  { id: 6, label: '糊状', icon: STOOL_PNG[6], desc: '边缘参差不齐', health: 'bad' },
  { id: 7, label: '水状', icon: STOOL_PNG[7], desc: '完全液态', health: 'bad' },
]

interface LogEntry {
  date: string
  typeId: number
  time: string
}

export default function StoolPage() {
  const [selected, setSelected] = useState<number | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('gg-stool-logs')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showLog, setShowLog] = useState(false)

  const handleLog = useCallback(() => {
    if (selected === null) return
    const entry: LogEntry = {
      date: new Date().toISOString().slice(0, 10),
      typeId: selected,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = [entry, ...logs]
    setLogs(updated)
    localStorage.setItem('gg-stool-logs', JSON.stringify(updated))
    const bristol = BRISTOL_TYPES.find((b) => b.id === selected)
    toast(`已记录：${bristol?.label}`, 'success')
  }, [selected, logs])

  const healthColor = (h: string) => {
    if (h === 'good') return 'bg-green-100 border-green-400'
    if (h === 'ok') return 'bg-yellow-50 border-yellow-400'
    return 'bg-red-50 border-red-300'
  }

  return (
    <div className="flex flex-col h-full pb-4 px-4 overflow-auto">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-garden-forest">便便日记</h1>
        <p className="text-sm text-gray-600 mt-1">根据布里斯托便便分类法记录</p>
      </div>

      {/* Bristol chart */}
      <div className="parchment-card p-4 max-w-sm mx-auto w-full">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">布里斯托便便分类</h2>
        <div className="flex flex-col gap-2">
          {BRISTOL_TYPES.map((b) => (
            <button
              key={b.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selected === b.id
                  ? `border-garden-forest shadow-md ${healthColor(b.health)}`
                  : 'border-transparent bg-white/40 hover:bg-white/70'
              }`}
              onClick={() => setSelected(b.id)}
            >
              <img src={b.icon} alt={b.label} className="w-10 h-10 object-contain shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-700">类型{b.id}：{b.label}</p>
                <p className="text-xs text-gray-600">{b.desc}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                b.health === 'good' ? 'bg-green-100 text-green-700'
                  : b.health === 'ok' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-500'
              }`}>
                {b.health === 'good' ? '健康' : b.health === 'ok' ? '正常' : '注意'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Log button */}
      <div className="parchment-card p-4 max-w-sm mx-auto w-full mt-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleLog}
          disabled={selected === null}
        >
          <span className="inline-flex items-center gap-1.5"><UiIcon name="notebookPen" size={16} /> 记录便便</span>
        </Button>
      </div>

      {/* Recent logs */}
      <div className="parchment-card p-4 max-w-sm mx-auto w-full mt-6">
        <button
          className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1"
          onClick={() => setShowLog(!showLog)}
        >
          最近记录 {showLog ? '▲' : '▼'}
        </button>
        {showLog && (
          <div className="flex flex-col gap-2">
            {logs.slice(0, 14).map((entry, i) => {
              const bristol = BRISTOL_TYPES.find((b) => b.id === entry.typeId)
              return (
                <div key={i} className="flex items-center gap-2 bg-white/40 rounded-lg px-3 py-2 text-sm">
                  <img src={bristol?.icon} alt={bristol?.label} className="w-8 h-8 object-contain" />
                  <span className="text-gray-600">{entry.date}</span>
                  <span className="text-gray-500">{entry.time}</span>
                  <span className="text-gray-600 ml-auto">{bristol?.label}</span>
                </div>
              )
            })}
            {logs.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">暂无记录</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
