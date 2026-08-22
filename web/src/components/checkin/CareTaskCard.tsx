import { useState } from 'react'
import { UiIcon } from '@/lib/uiIcons'
import type { TaskId, TaskStatus } from '@/types/checkin'

export interface GardenSubItem {
  key: string
  label: string
  done: boolean
}

interface Props {
  id: TaskId
  label: string
  img?: string
  gradient: 'water' | 'diet' | 'sleep' | 'exercise' | 'garden'
  accent: string
  xp: number
  status: TaskStatus
  tip: string
  gardenSubs?: GardenSubItem[]
  allGardenDone?: boolean
  editing: boolean
  onToggle: () => void
  onToggleSub?: (key: string) => void
}

export default function CareTaskCard({
  id,
  label,
  img,
  gradient,
  xp,
  status,
  gardenSubs,
  allGardenDone,
  editing,
  onToggle,
  onToggleSub,
}: Props) {
  const isDone = status === 'done' || status === 'makeup'
  const pending = status === 'pending'
  const pillText = isDone ? (status === 'makeup' ? '已补卡' : '已完成') : '去完成'
  const [subsOpen, setSubsOpen] = useState(false)

  const handlePrimary = () => {
    if (editing) return
    if (isDone) {
      onToggle()
      return
    }
    // 探索花园：未完成全部小任务前，点√只是展开小任务
    if (id === 'task_garden' && gardenSubs && !allGardenDone) {
      setSubsOpen((v) => !v)
      return
    }
    onToggle()
  }

  return (
    <article
      className={`relative h-full overflow-hidden rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.16)] ${
        !editing && pending ? 'cursor-pointer' : ''
      }`}
      onClick={() => {
        if (editing) return
        if (pending) onToggle()
      }}
    >
      {/* 卡面 = 整张素材铺满卡片，完整显示 */}
      {img ? (
        <img src={img} alt={label} className="absolute inset-x-0 top-0 w-full h-[112%] object-cover" draggable={false} />
      ) : (
        <div className={`absolute inset-0 w-full h-full ggc-task-${gradient}`} />
      )}

      {/* 花园小任务 chips：点√后展开，叠加在卡片图片下部 */}
      {id === 'task_garden' && gardenSubs && subsOpen && !isDone && (
        <div className="absolute inset-x-0 bottom-[74px] flex justify-center gap-1 px-2 z-10">
          {gardenSubs.map((s) => (
            <button
              key={s.key}
              className={`inline-flex items-center justify-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium shadow-md transition-colors ${
                s.done
                  ? 'bg-[#d9efbe] border-green-300 text-green-700'
                  : 'bg-white border-gray-200 text-gray-600'
              }`}
              onClick={(e) => {
                if (editing) return
                e.stopPropagation()
                onToggleSub?.(s.key)
              }}
            >
              <span>{s.done ? '✓' : '○'}</span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 底部控制区：叠加在卡片图片内部，居中 */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-2 z-10">
        <div className="flex items-center gap-1.5">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0"
            style={
              isDone
                ? { background: '#4caf50', color: '#fff', border: 'none' }
                : { background: '#fff', color: '#4caf50', border: '2px solid #4caf50' }
            }
            onClick={(e) => {
              e.stopPropagation()
              handlePrimary()
            }}
            title={isDone ? '取消完成' : id === 'task_garden' && gardenSubs && !allGardenDone ? '查看小任务' : '完成'}
          >
            <UiIcon name="check" size={16} strokeWidth={3.2} />
          </button>

          <span
            className={`w-20 text-[11px] font-bold px-2 py-1 rounded-full border text-center whitespace-nowrap shadow-md ${
              isDone ? 'bg-[#4caf50] border-[#4caf50] text-white' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            {pillText}
          </span>

          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-green-700 bg-white border border-gray-100 rounded-full px-2 py-1 shrink-0 whitespace-nowrap shadow-md">
            <UiIcon name="zap" size={11} className="text-amber-500" />
            +{xp}
          </span>
        </div>
      </div>
    </article>
  )
}
