import { UiIcon } from '@/lib/uiIcons'

interface Props {
  level: number
  stageName: string
  xpToNext: number
  xpPct: number
  plantGrowth: number
  vitality: number
  weekLabel: string
}

export default function GardenGrowthCard({ level, stageName, xpToNext, xpPct, plantGrowth, vitality, weekLabel }: Props) {
  const stats = [
    { icon: '🌱', label: '植物成长', value: `${plantGrowth}%`, color: 'text-[#5b9d3b]' },
    { icon: '🌸', label: '花园活力', value: `${vitality}%`, color: 'text-[#4c9a2f]' },
    { icon: '⭐', label: '本周表现', value: weekLabel, color: 'text-[#6b9c3b]' },
  ]
  const pct = Math.round(Math.min(100, Math.max(0, xpPct)))
  return (
    <div className="garden-growth-card relative flex flex-col h-full overflow-hidden">
      {/* 顶部标题 */}
      <h2 className="growth-title relative z-10 flex items-center gap-1.5 pt-[14px] px-[16px] shrink-0">
        我的花园成长
        <UiIcon name="sprout" size={18} className="text-[#6a9f3d]" />
      </h2>

      {/* 主体：左侧成长状态 + 右侧指标 */}
      <div className="relative z-10 flex-1 flex min-h-0 px-[14px] pt-[4px]">
        {/* 左侧：植物插画 + 等级 + 阶段 */}
        <div className="w-[48%] flex flex-col items-center justify-center">
          <span className="growth-plant leading-none drop-shadow-[0_5px_8px_rgba(90,130,50,0.35)]">🌱</span>
          <div className="flex items-baseline gap-[5px] mt-[6px]">
            <span className="level-label">生态等级</span>
            <strong className="level-num">Lv.{level}</strong>
          </div>
          <span className="stage-label mt-[5px]">{stageName}</span>
        </div>

        {/* 右侧：三个成长指标 */}
        <div className="flex-1 flex flex-col justify-center gap-[8px] pl-[10px] min-w-0">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-name">{s.label}</span>
              <strong className={`stat-value ${s.color}`}>{s.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* 底部 XP 进度 */}
      <div className="relative z-10 px-[16px] pb-[10px] pt-[4px] shrink-0">
        <div className="xp-progress">
          <div className="xp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="xp-text">
          距离 Lv.{level + 1} 还有 <strong>{xpToNext} XP</strong>
        </p>
      </div>

      {/* 装饰 */}
      <UiIcon name="leaf" size={22} className="garden-growth-deco top-[10px] right-[12px] opacity-[0.55]" />
      <UiIcon name="flower" size={20} className="garden-growth-deco bottom-[34px] right-[10px] opacity-[0.4]" />
    </div>
  )
}
