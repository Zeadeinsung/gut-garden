import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGardenStore } from '@/stores/gardenStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { useBadgeStore } from '@/stores/badgeStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import { Button } from '@/components/ui/Button'
import Header from '@/components/navigation/Header'
import { UiIcon } from '@/lib/uiIcons'
import { api } from '@/lib/api'
import { isRegistered, getActiveChildId } from '@/hooks/useApiSync'

type Period = 'week' | 'month'

interface ReportData {
  period: { start: string; end: string; type: string }
  checkin_rate: number
  max_streak: number
  growth_stage: number
  stage_label: string
  badges: { total: number; bronze: number; silver: number; gold: number }
  stool_count: number
  bristol_distribution: { bristol: number; count: number }[]
  feed_count: number
  quiz_accuracy: number
  modules_completed: number
  sub_item_rate: number
  active_days: number
  garden_state_distribution: { state: string; count: number }[]
}

const DEFAULTS: Record<string, BlockPos> = {
  checkin: { x: 16,  y: 16,  w: 620, h: 200 },
  garden:  { x: 652, y: 16,  w: 612, h: 200 },
  learn:   { x: 16,  y: 232, w: 620, h: 200 },
  stool:   { x: 652, y: 232, w: 612, h: 200 },
  growth:  { x: 16,  y: 448, w: 1248, h: 100 },
}

export default function ReportPage() {
  const navigate = useNavigate()
  const { gardenLevel, gardenXp, interactionCount, currentState } = useGardenStore()
  const { streak } = useCheckinStore()
  const awarded = useBadgeStore((s) => s.awarded.length)
  const [period, setPeriod] = useState<Period>('month')
  const [report, setReport] = useState<ReportData | null>(null)
  const registered = isRegistered()
  const { editing, containerRef, pos, handleMove, handleResize } = useEditorPage('report', DEFAULTS)

  useEffect(() => {
    if (!isRegistered()) return
    const childId = getActiveChildId()
    if (!childId) return
    const path = period === 'week' ? '/report/weekly' : '/report/monthly'
    api
      .get<ReportData>(`${path}?child_id=${childId}`)
      .then(setReport)
      .catch(() => {})
  }, [period])

  const stateLabel: Record<string, string> = {
    healthy: '健康',
    high_sugar: '糖分过高',
    dry: '缺水',
    recovering: '恢复中',
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        leftSlot={
          <button
            className="flex items-center gap-1 text-gray-500 hover:text-garden-forest transition-colors"
            onClick={() => navigate('/profile')}
          >
            <UiIcon name="chevronLeft" size={20} />
            <span className="font-bold text-sm text-garden-forest inline-flex items-center gap-1"><UiIcon name="chart" size={15} /> 成长报告</span>
          </button>
        }
        centerSlot={
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 inline-flex"><UiIcon name="calendar" size={15} /></span>
            <div className="flex gap-0.5 bg-garden-cream rounded-lg p-0.5">
              {([
                { key: 'week' as Period, label: '周报' },
                { key: 'month' as Period, label: '月报' },
              ]).map((p) => (
                <button
                  key={p.key}
                  className={`px-4 py-1 rounded-md text-xs font-medium transition-colors ${
                    period === p.key
                      ? 'bg-white text-garden-forest shadow-sm'
                      : 'text-gray-400'
                  }`}
                  onClick={() => setPeriod(p.key)}
                >
                  {p.label} {period === p.key && '●'}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {report ? `${report.period.start} ~ ${report.period.end}` : `2026年${period === 'month' ? '7月' : '第31周'}`}
            </span>
          </div>
        }
      />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium">
          Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit
        </div>
      )}

      {/* Absolute positioning context */}
      <div ref={containerRef} className="flex-1 relative min-h-0">

        <DraggableBlock blockId="checkin" defaultPos={pos('checkin')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="clipboard" size={15} /> 打卡坚持</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-forest">{report ? report.active_days : registered ? 0 : 30}</p>
                <p className="text-xs text-gray-400">累计天数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-gold">{streak}</p>
                <p className="text-xs text-gray-400">连续天数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-hero">{report ? report.max_streak : registered ? 0 : 15}</p>
                <p className="text-xs text-gray-400">最长连续</p>
              </div>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="garden" defaultPos={pos('garden')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="gamepad" size={15} /> 花园互动</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-forest">{report ? report.feed_count : interactionCount}</p>
                <p className="text-xs text-gray-400">投喂次数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-gold">{report ? report.active_days : registered ? 0 : 30}</p>
                <p className="text-xs text-gray-400">探索天数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-water">Lv.{gardenLevel}</p>
                <p className="text-xs text-gray-400">花园等级</p>
              </div>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="learn" defaultPos={pos('learn')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="brain" size={15} /> 科普学习</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-forest">{report ? `${report.quiz_accuracy}%` : '0%'}</p>
                <p className="text-xs text-gray-400">问答正确率</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-gold">{report ? `${report.modules_completed}/5` : '0/5'}</p>
                <p className="text-xs text-gray-400">完成模块</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-garden-hero">{report ? report.badges.total : awarded}</p>
                <p className="text-xs text-gray-400">获得徽章</p>
              </div>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="stool" defaultPos={pos('stool')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">消化健康</h3>
            <div className="text-center">
              <p className="text-sm text-gray-500">便便类型分布</p>
              {(() => {
                const dist = report?.bristol_distribution ?? []
                const max = Math.max(1, ...dist.map((d) => d.count))
                return dist.length ? (
                  <div className="flex items-end justify-center gap-2 mt-2 h-16">
                    {dist.map((d) => (
                      <div key={d.bristol} className="flex flex-col items-center">
                        <div
                          className="w-8 rounded-t-md"
                          style={{
                            height: Math.max(4, Math.round((d.count / max) * 48)),
                            backgroundColor: d.bristol >= 3 && d.bristol <= 5 ? '#7EC8E3' : '#F38D83',
                          }}
                        />
                        <span className="text-[10px] text-gray-400 mt-1">Type{d.bristol}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-3 py-4">{registered ? '暂无便便记录' : '暂无数据'}</p>
                )
              })()}
              <p className="text-xs text-gray-400 mt-2">
                {report ? `共 ${report.stool_count} 次记录` : '共 0 次记录'}
              </p>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="growth" defaultPos={pos('growth')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="sprout" size={15} /> 总体成长</h3>
            <div className="flex items-center gap-3">
              <span className="text-garden-forest"><UiIcon name="sprout" size={26} /></span>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-700">
                  {report ? `第 ${report.growth_stage} 阶段 · ${report.stage_label}` : `第 ${gardenLevel} 阶段 · ${stateLabel[currentState]}`}
                </p>
                <ProgressBar value={gardenXp % Math.max(1, gardenLevel * 100)} max={Math.max(1, gardenLevel * 100)} color="bg-garden-gold" />
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{report ? report.badges.total : awarded}/60 枚徽章</p>
                <p>{gardenXp} XP</p>
              </div>
            </div>
          </div>
        </DraggableBlock>
      </div>

      {/* Print button — stays at bottom, not draggable */}
      <div className="max-w-sm mx-auto w-full py-2">
        <Button variant="secondary" className="w-full" onClick={() => window.print()}>
          <span className="inline-flex items-center gap-1.5"><UiIcon name="printer" size={16} /> 打印报告</span>
        </Button>
      </div>
    </div>
  )
}
