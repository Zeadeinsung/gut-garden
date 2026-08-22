import { UiIcon } from '@/lib/uiIcons'
import { useUIStore } from '@/stores/uiStore'

type StoolHealth = 'normal' | 'constipation' | 'diarrhea' | 'none'

interface Props {
  careDone: number
  total: number
  stoolHealth: StoolHealth
  onClassroom: () => void
  onBadges: () => void
}

export default function GardenAssistant({ careDone, total, stoolHealth, onClassroom, onBadges }: Props) {
  const soundEnabled = useUIStore((s) => s.soundEnabled)
  const setSoundEnabled = useUIStore((s) => s.setSoundEnabled)
  const reportMode = stoolHealth === 'constipation' || stoolHealth === 'diarrhea'

  const message = reportMode
    ? '昨天的便便显示需要调整一下，今天重点关注饮食和水分哦！'
    : `早上好，小主人！☀️ 今天已完成 ${careDone}/${total} 项任务，花园变得更漂亮啦！`

  const tips =
    stoolHealth === 'constipation'
      ? ['多吃绿叶蔬菜和纤维食物', '今天喝够 8 杯水', '饭后散步 15 分钟']
      : stoolHealth === 'diarrhea'
        ? ['清淡饮食，避免生冷', '注意腹部保暖', '适量补充温水']
        : ['先完成花园探索再吃饭', '记得喝够 6 杯水']

  return (
    <div className="ggc-assistant flex flex-col h-full p-5 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center shadow-md overflow-hidden shrink-0">
            <img src="/assets/characters/png/char_xiaoyuan.webp" alt="菌小园助手" className="w-11 h-11 object-contain" draggable={false} />
          </span>
          <div>
            <h3 className="text-[17px] font-bold text-green-800">菌小园助手</h3>
            <p className="text-[11px] text-gray-500">你的打卡小帮手</p>
          </div>
        </div>
        <button
          className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center text-gray-400 shadow-sm shrink-0 active:scale-90 transition-transform"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? '关闭音效' : '开启音效'}
        >
          <UiIcon name={soundEnabled ? 'volumeLine' : 'volumeMuteLine'} size={18} />
        </button>
      </div>

      {/* 中段内容 */}
      <div className="flex-1 min-h-0 flex flex-col justify-center gap-3">
        <div className="bg-white/80 rounded-2xl rounded-bl-sm p-3 shadow-sm">
          <p className="text-[13px] text-gray-600 leading-relaxed">{message}</p>
        </div>

        <div>
          <p className="text-[13px] font-bold text-amber-700 inline-flex items-center gap-1">
            <UiIcon name="lightbulb" size={14} className="text-amber-500" />
            今日小建议
          </p>
          <ul className="text-[12px] text-gray-500 mt-1.5 space-y-1">
            {tips.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-bold text-green-700 inline-flex items-center gap-1">
            <UiIcon name="book" size={14} className="text-green-600" />
            今日小知识
          </p>
          <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">
            膳食纤维是益生菌最喜欢的食物，可以帮助肠道更健康！
          </p>
        </div>

        <button
          className="w-full py-2.5 bg-[#4CAF50] text-white rounded-2xl text-[14px] font-bold shadow-md hover:bg-[#43A047] active:scale-95 transition-all"
          onClick={onClassroom}
        >
          去知识课堂看看 →
        </button>
      </div>

      {/* 快捷入口 */}
      <div className="mt-3 pt-3 border-t border-white/60 shrink-0">
        <p className="text-[12px] text-gray-500 mb-2">快捷入口</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex items-center gap-2 bg-white/70 rounded-2xl px-3 py-2 hover:bg-white active:scale-95 transition-all"
            onClick={onClassroom}
          >
            <UiIcon name="book" size={18} className="text-green-600" />
            <span className="text-[12px] text-gray-600">知识课堂</span>
          </button>
          <button
            className="flex items-center gap-2 bg-white/70 rounded-2xl px-3 py-2 hover:bg-white active:scale-95 transition-all"
            onClick={onBadges}
          >
            <UiIcon name="trophy" size={18} className="text-amber-500" />
            <span className="text-[12px] text-gray-600">成长徽章</span>
          </button>
        </div>
      </div>
    </div>
  )
}
