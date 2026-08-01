import { useGardenStore } from '@/stores/gardenStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { useBadgeStore } from '@/stores/badgeStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'

export default function ReportPage() {
  const { gardenLevel, gardenXp, interactionCount, moistureLevel, currentState } = useGardenStore()
  const { streak } = useCheckinStore()
  const awarded = useBadgeStore((s) => s.awarded.length)

  const stateLabel: Record<string, string> = {
    healthy: '😊 健康',
    high_sugar: '😣 糖分过高',
    dry: '🥵 缺水',
    recovering: '🤕 恢复中',
  }

  const metrics = [
    { label: '花园等级', value: `Lv.${gardenLevel}`, icon: '🌱' },
    { label: '连续打卡', value: `${streak}天`, icon: '🔥' },
    { label: '徽章收集', value: `${awarded}个`, icon: '🏅' },
    { label: '花园状态', value: stateLabel[currentState] || currentState, icon: '🏡' },
    { label: '水分值', value: `${moistureLevel}%`, icon: '💧' },
    { label: '互动次数', value: `${interactionCount}次`, icon: '🤝' },
  ]

  return (
    <div className="flex flex-col h-full pb-20 px-4 overflow-auto">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-garden-forest">成长报告</h1>
        <p className="text-sm text-gray-400 mt-1">宝宝的肠道健康数据一览</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white/60 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-2xl">{m.icon}</span>
            <p className="text-xl font-bold text-garden-forest mt-1">{m.value}</p>
            <p className="text-xs text-gray-400">{m.label}</p>
          </div>
        ))}
      </div>

      {/* XP progress */}
      <div className="max-w-sm mx-auto w-full mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>经验值进度</span>
          <span>{gardenXp}/{gardenLevel * 100}</span>
        </div>
        <ProgressBar value={gardenXp % (gardenLevel * 100)} max={gardenLevel * 100} color="bg-garden-gold" />
      </div>

      {/* Moisture gauge */}
      <div className="max-w-sm mx-auto w-full mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>花园水分</span>
          <span>{moistureLevel}%</span>
        </div>
        <ProgressBar
          value={moistureLevel}
          max={100}
          color={moistureLevel < 30 ? 'bg-garden-coral' : moistureLevel < 60 ? 'bg-garden-gold' : 'bg-garden-water'}
        />
      </div>

      {/* Export */}
      <div className="max-w-sm mx-auto w-full">
        <Button variant="secondary" className="w-full" onClick={() => window.print()}>
          📋 打印报告
        </Button>
      </div>
    </div>
  )
}
