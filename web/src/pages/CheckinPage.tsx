import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckinStore } from '@/stores/checkinStore'
import { useGardenStore } from '@/stores/gardenStore'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { toast } from '@/components/ui/Toast'
import Header from '@/components/navigation/Header'
import { api } from '@/lib/api'
import { UiIcon } from '@/lib/uiIcons'
import { applyCheckinToday, isRegistered, getActiveChildId, type TodayApi } from '@/hooks/useApiSync'
import type { TaskId, TaskStatus } from '@/types/checkin'

interface SubTaskState {
  gardenGame: boolean
  gardenVideo: boolean
  gardenQuiz: boolean
}

interface TaskDef {
  id: TaskId
  label: string
  icon: string
  img?: string
  charImg?: string
  color: string
  grad: string
  chip: string
  subTasks: { key?: string; icon?: string; label: string; xp: number }[]
  tipHealthy: string
  tipConstipation: string
  tipDiarrhea: string
  tipNormal: string
}

const TASKS: TaskDef[] = [
  {
    id: 'task_garden', label: '探索花园', icon: 'leaf', img: '/assets/ui/ui_task_explore.png', charImg: '/assets/tasks/task_char_garden.png', color: 'bg-green-500', grad: 'from-green-400 to-emerald-600', chip: 'text-green-600',
    subTasks: [
      { key: 'gardenGame', icon: 'gamepad', label: '小游戏', xp: 5 },
      { key: 'gardenVideo', icon: 'monitorPlay', label: '视频课', xp: 5 },
      { key: 'gardenQuiz', icon: 'brain', label: '常识题 ×3', xp: 10 },
    ],
    tipHealthy: '花园状态良好，继续探索吧！',
    tipConstipation: '便便有点干硬，来花园看看怎么改善吧！',
    tipDiarrhea: '便便有点稀，来花园学习调理方法吧！',
    tipNormal: '花园需要你的照顾，快来探索吧！',
  },
  {
    id: 'task_eat', label: '健康饮食', icon: 'salad', img: '/assets/ui/ui_task_eat.png', charImg: '/assets/tasks/task_char_eat.png', color: 'bg-orange-500', grad: 'from-orange-300 to-orange-500', chip: 'text-orange-500',
    subTasks: [
      { label: '吃了蔬菜 +15', xp: 15 },
      { label: '吃了水果 +10', xp: 10 },
    ],
    tipHealthy: '继续保持均衡饮食！',
    tipConstipation: '多吃绿叶蔬菜和纤维食物，试试蒸煮替代油炸～',
    tipDiarrhea: '清淡饮食为主，避免生冷油腻食物～',
    tipNormal: '今天吃好了吗？记得吃蔬菜水果哦！',
  },
  {
    id: 'task_sleep', label: '优质睡眠', icon: 'moon', img: '/assets/ui/ui_task_sleep.png', charImg: '/assets/tasks/task_char_sleep.png', color: 'bg-purple-500', grad: 'from-purple-400 to-indigo-500', chip: 'text-purple-500',
    subTasks: [
      { label: '早睡 +10', xp: 10 },
    ],
    tipHealthy: '睡眠质量很好！',
    tipConstipation: '作息不规律也会影响便便，今晚试试21:30前上床～',
    tipDiarrhea: '报告显示作息波动，好好休息有助于肠道恢复～',
    tipNormal: '昨晚睡得好吗？早睡早起身体棒！',
  },
  {
    id: 'task_water', label: '补充水分', icon: 'droplet', img: '/assets/ui/ui_task_water.png', charImg: '/assets/tasks/task_char_water.png', color: 'bg-blue-500', grad: 'from-sky-400 to-blue-600', chip: 'text-blue-500',
    subTasks: [],
    tipHealthy: '喝水习惯很棒！',
    tipConstipation: '今天目标：8杯水 多喝水能软化便便哦！',
    tipDiarrhea: '适量饮水补充水分，今天目标：6杯水',
    tipNormal: '记得喝够6杯水哦！',
  },
  {
    id: 'task_sport', label: '活力运动', icon: 'footprints', img: '/assets/ui/ui_task_sport.png', charImg: '/assets/tasks/task_char_sport.png', color: 'bg-rose-500', grad: 'from-rose-400 to-red-500', chip: 'text-rose-500',
    subTasks: [
      { label: '户外活动≥30min +10', xp: 10 },
    ],
    tipHealthy: '运动让肠道更健康！',
    tipConstipation: '运动能促进肠道蠕动，今天动起来吧！',
    tipDiarrhea: '适度活动有助恢复，不要剧烈运动哦～',
    tipNormal: '今天动起来了吗？',
  },
]

const REWARDS = [
  { icon: 'droplet', label: '小溪能量', value: '+5', bg: 'bg-gradient-to-br from-sky-400 to-blue-600', color: 'text-blue-500' },
  { icon: 'sprout', label: '植物成长', value: '+10', bg: 'bg-gradient-to-br from-green-400 to-emerald-600', color: 'text-green-600' },
  { icon: 'starGold', label: '菌群快乐', value: '+8', bg: 'bg-gradient-to-br from-amber-400 to-amber-600', color: 'text-amber-500' },
  { icon: 'sun', label: '花园币', value: '+5', bg: 'bg-gradient-to-br from-orange-400 to-orange-500', color: 'text-orange-500' },
]

type StoolHealth = 'normal' | 'constipation' | 'diarrhea' | 'none'

function fmtLocalKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getYesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return fmtLocalKey(d)
}

function getTodayKey(): string {
  return fmtLocalKey(new Date())
}

function getYesterdayStoolHealth(): StoolHealth {
  try {
    const saved = localStorage.getItem('gg-stool-logs')
    if (!saved) return 'none'
    const logs = JSON.parse(saved)
    const yesterday = getYesterdayKey()
    const yesterdayLogs = logs.filter((l: { date: string }) => l.date === yesterday)
    if (yesterdayLogs.length === 0) return 'none'
    const hasBad = yesterdayLogs.some((l: { typeId: number }) => [1, 2].includes(l.typeId))
    const hasLoose = yesterdayLogs.some((l: { typeId: number }) => [6, 7].includes(l.typeId))
    if (hasBad) return 'constipation'
    if (hasLoose) return 'diarrhea'
    return 'normal'
  } catch {
    return 'none'
  }
}

function getTaskTip(task: TaskDef, stoolHealth: StoolHealth, isDone: boolean): string {
  if (isDone) return task.tipHealthy
  switch (stoolHealth) {
    case 'constipation': return task.tipConstipation
    case 'diarrhea': return task.tipDiarrhea
    default: return task.tipNormal
  }
}

function getDefaultToday() {
  return {
    date: getTodayKey(),
    tasks: TASKS.map((t) => ({ id: t.id, status: 'pending' as TaskStatus })),
    all_completed: false,
  }
}

const TASK_ID_TO_CODE: Partial<Record<TaskId, string>> = {
  task_eat: 'eat',
  task_sleep: 'sleep',
  task_water: 'water',
  task_sport: 'sport',
}

const CHECKIN_DEFAULTS: Record<string, BlockPos> = {
  checkListRow: { x: 16, y: 16, w: 1000, h: 300 },
  assistant:    { x: 1032, y: 16, w: 248, h: 480 },
  calendar:     { x: 16, y: 332, w: 490, h: 190 },
  rewards:      { x: 522, y: 332, w: 494, h: 190 },
}

export default function CheckinPage() {
  const navigate = useNavigate()
  const store = useCheckinStore()
  const { gardenLevel } = useGardenStore()
  const { editing, containerRef, pos, handleMove, handleResize } = useEditorPage('checkin', CHECKIN_DEFAULTS)
  const [expanded, setExpanded] = useState<TaskId | null>(null)
  const [waterCount, setWaterCount] = useState(0)
  const [gardenSubs, setGardenSubs] = useState<SubTaskState>({ gardenGame: false, gardenVideo: false, gardenQuiz: false })

  const stoolHealth = useMemo(() => getYesterdayStoolHealth(), [])
  const showReportBanner = stoolHealth === 'constipation' || stoolHealth === 'diarrhea'

  const today = useMemo(() => {
    const key = getTodayKey()
    if (!store.today || store.today.date !== key) {
      const fresh = getDefaultToday()
      store.setToday(fresh)
      return fresh
    }
    return store.today
  }, [store.today])

  const gardenSubsAllDone = gardenSubs.gardenGame && gardenSubs.gardenVideo && gardenSubs.gardenQuiz
  const completedCount = today.tasks.filter((t) => t.status === 'done').length
  const allDone = completedCount === TASKS.length
  const energy = (completedCount / TASKS.length) * 100

  const handleGardenLocked = useCallback(() => {
    if (isRegistered()) {
      toast('去花园互动 3 次即可完成探索任务', 'info')
      navigate('/garden')
    } else {
      setExpanded('task_garden')
    }
  }, [navigate])

  const toggleTask = useCallback((taskId: TaskId) => {
    if (isRegistered()) {
      const code = TASK_ID_TO_CODE[taskId]
      const childId = getActiveChildId()
      if (!code || !childId) return
      api
        .post<TodayApi & { badges_awarded?: unknown }>('/checkin/confirm-task', { child_id: childId, task_code: code })
        .then((data) => {
          applyCheckinToday(data)
          if (data.all_completed) toast('太棒了！今日全部完成！', 'success')
        })
        .catch(() => {})
      return
    }

    if (taskId === 'task_garden') {
      if (!gardenSubsAllDone) {
        setExpanded('task_garden')
        return
      }
    }

    const st = useCheckinStore.getState()
    if (!st.today) return

    const tasks = st.today.tasks.map((t) => {
      if (t.id !== taskId) return t
      const next: TaskStatus = t.status === 'done' ? 'pending' : 'done'
      return { ...t, status: next }
    })

    const all_completed = tasks.every((t) => t.status === 'done')
    st.setToday({ ...st.today, tasks, all_completed })

    if (all_completed) {
      st.setStreak(st.streak + 1)
      toast('太棒了！今日全部完成！', 'success')
    }
  }, [gardenSubsAllDone])

  const handleMakeup = useCallback((taskId: TaskId) => {
    if (isRegistered()) {
      const childId = getActiveChildId()
      if (!childId) return
      const y = new Date()
      y.setDate(y.getDate() - 1)
      const date = y.toISOString().slice(0, 10)
      api
        .post<TodayApi & { badges_awarded?: unknown }>('/checkin/makeup', { child_id: childId, calendar_date: date })
        .then((data) => {
          applyCheckinToday(data)
          toast('已使用补卡机会', 'info')
        })
        .catch(() => {})
      return
    }

    const st = useCheckinStore.getState()
    if (!st.today) return
    if (!st.useMakeup()) {
      toast('本周补卡次数已用完', 'error')
      return
    }
    const tasks = st.today.tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'makeup' as TaskStatus } : t
    )
    st.setToday({ ...st.today, tasks, all_completed: tasks.every((t) => t.status !== 'pending') })
    toast('已使用补卡机会', 'info')
  }, [])

  const getTaskStyle = (status: TaskStatus) => {
    switch (status) {
      case 'done': return 'border-green-300 bg-gradient-to-b from-green-50 to-green-100/70'
      case 'makeup': return 'border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100/70'
      case 'skipped': return 'border-gray-200 bg-gray-50/70 opacity-50'
      default: return 'border-gray-200/80 bg-gradient-to-b from-white/95 to-white/70'
    }
  }

  const bannerText = stoolHealth === 'constipation'
    ? '昨日便便偏干硬 — 今日重点关注：多喝水、多吃纤维食物、规律运动'
    : stoolHealth === 'diarrhea'
      ? '昨日便便偏稀 — 今日重点关注：清淡饮食、避免生冷、注意保暖'
      : ''

  // Calendar
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // 打卡日历：注册模式从后端取真实每日状态；无记录的天数保持中立灰色，不再默认打勾。
  const [calendarMap, setCalendarMap] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!isRegistered()) {
      setCalendarMap({})
      return
    }
    const childId = getActiveChildId()
    if (!childId) return
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    api
      .get<{ days: { date: string; status: string }[] }>(`/checkin/calendar?child_id=${childId}&month=${month}`)
      .then((data) => {
        const map: Record<string, string> = {}
        for (const d of data.days) map[d.date] = d.status
        setCalendarMap(map)
      })
      .catch(() => {})
  }, [store.today?.date])

  return (
    <div className="flex flex-col min-h-full">
      <Header
        transparent
        leftSlot={
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md hover:bg-[#7A9538] active:scale-95 transition-all"
              onClick={() => navigate('/')}
            >
              <UiIcon name="chevronLeft" size={20} />
            </button>
            <div className="leading-tight">
              <p className="font-bold text-sm text-garden-forest">每日打卡</p>
              <p className="text-[10px] text-gray-400">每天照顾一点点，花园会更好哦！</p>
            </div>
          </div>
        }
        centerSlot={
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="flex items-center gap-3 bg-gradient-to-b from-amber-50 to-amber-100/70 border-2 border-amber-200/70 rounded-2xl px-4 py-1.5 shadow-sm w-full max-w-md">
              <span className="text-xs text-amber-800 font-bold whitespace-nowrap inline-flex items-center gap-1">
                <UiIcon name="zap" size={13} />
                今日花园能量
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-bold text-green-600">
                    {Math.round(energy)}
                    <span className="text-[10px] text-gray-400 font-normal">/{Math.round(100)}</span>
                  </span>
                </div>
                <ProgressBar value={energy} max={100} color={allDone ? 'bg-garden-gold' : 'bg-garden-mascot'} />
              </div>
              <span className="text-[10px] text-amber-700 whitespace-nowrap shrink-0">距开花还差 {Math.round(100 - energy)}</span>
            </div>
          </div>
        }
        userSlot={null}
      />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium">
          Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative min-h-0">

        {/* Character illustration — shows active task's character */}
        {expanded && (() => {
          const activeTask = TASKS.find(t => t.id === expanded)
          if (!activeTask?.charImg) return null
          return (
            <div className="absolute flex items-center justify-center z-10 pointer-events-none" style={{ left: 252, top: -8, right: 264, bottom: 0 }}>
              <img
                src={activeTask.charImg}
                alt={activeTask.label}
                className="max-h-full max-w-full object-contain opacity-90 drop-shadow-lg"
                draggable={false}
              />
            </div>
          )
        })()}

        {/* Report banner — conditional */}
        {showReportBanner && (
          <div className="absolute bg-garden-coral/10 border border-garden-coral/30 rounded-xl px-4 py-1.5 text-xs text-garden-forest z-10 flex items-center gap-1.5" style={{ left: 16, top: 0, width: 1000 }}>
            <UiIcon name="search" size={13} />
            {bannerText}
          </div>
        )}

        {/* Task cards — horizontal scroll row */}
        <DraggableBlock blockId="checkListRow" defaultPos={pos('checkListRow')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="h-full overflow-x-auto overflow-y-hidden rounded-2xl">
            <div className="flex gap-3 h-full p-1" style={{ minWidth: TASKS.length * 186 + (TASKS.length - 1) * 12 + 8 }}>
              {TASKS.map((task) => {
                const t = today.tasks.find((x) => x.id === task.id)!
                const statusStyle = getTaskStyle(t.status)
                const isExpanded = expanded === task.id
                const isGarden = task.id === 'task_garden'
                const canToggle = isGarden ? (isRegistered() ? false : gardenSubsAllDone) : true
                const tip = getTaskTip(task, stoolHealth, t.status === 'done' || t.status === 'makeup')
                const xp = task.subTasks.reduce((s, st) => s + st.xp, 0)
                const gardenDone = [gardenSubs.gardenGame, gardenSubs.gardenVideo, gardenSubs.gardenQuiz].filter(Boolean).length

                return (
                  <div
                    key={task.id}
                    className={`relative rounded-2xl border-2 transition-all duration-300 flex flex-col flex-shrink-0 overflow-hidden ${statusStyle}`}
                    style={{ width: 186 }}
                  >
                    {/* Top color band */}
                    <div className={`h-1.5 shrink-0 bg-gradient-to-r ${task.grad} relative z-20`} />

                    {/* Status ribbon */}
                    {t.status === 'done' && (
                      <span className="absolute top-3 right-2.5 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow z-20"><UiIcon name="check" size={13} /></span>
                    )}
                    {t.status === 'makeup' && (
                      <span className="absolute top-2.5 right-2 text-sm z-20 text-gray-500 bg-white/85 rounded-full w-6 h-6 flex items-center justify-center shadow"><UiIcon name="wrench" size={13} /></span>
                    )}

                    {/* Card header */}
                    <div
                      className={`flex-1 flex flex-col px-3 pt-2.5 pb-1.5 min-h-0 relative z-10 ${canToggle && t.status === 'pending' && !editing ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (editing) return
                        if (t.status === 'pending' && canToggle) toggleTask(task.id)
                        else if (t.status === 'pending' && !canToggle) handleGardenLocked()
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${task.grad} text-white flex items-center justify-center text-2xl shadow-md transition-transform active:scale-90 shrink-0 ${
                            t.status === 'done' || t.status === 'makeup'
                              ? ''
                              : canToggle
                                ? ''
                                : 'opacity-50 grayscale'
                          }`}
                          onClick={(e) => {
                            if (editing) return
                            e.stopPropagation()
                            if ((t.status === 'done' || t.status === 'makeup')) return
                            if (!canToggle) {
                              handleGardenLocked()
                              return
                            }
                            toggleTask(task.id)
                          }}
                        >
                          {task.img ? (
                            <img src={task.img} alt={task.label} className="w-9 h-9 object-contain drop-shadow" />
                          ) : (
                            <UiIcon name={task.icon} size={24} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs ${t.status === 'done' ? 'text-green-700' : 'text-gray-700'}`}>
                            {task.label}
                            {isGarden && !gardenSubsAllDone && t.status === 'pending' && (
                              <span className="text-[10px] text-garden-coral ml-1">({gardenDone}/3)</span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 leading-snug mt-0.5 line-clamp-2">{tip}</p>
                        </div>
                      </div>

                      {/* Character illustration — sits in the middle zone, full scene visible */}
                      {task.charImg && (
                        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0 mt-0.5">
                          <img
                            src={task.charImg}
                            alt={task.label}
                            className="max-h-full max-w-full object-contain drop-shadow-sm"
                            style={{ opacity: 0.95 }}
                            draggable={false}
                          />
                        </div>
                      )}

                      {/* Reward + actions */}
                      <div className="pt-1.5 flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-bold ${task.chip} bg-white/90 rounded-full px-2 py-0.5 shadow-sm shrink-0 inline-flex items-center gap-0.5`}>
                          <UiIcon name="zap" size={11} />
                          +{xp} 能量
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {t.status === 'pending' && task.subTasks.length > 0 && (
                            <button
                              className="text-[10px] text-gray-400 hover:text-garden-forest px-0.5"
                              onClick={(e) => {
                                if (editing) return
                                e.stopPropagation()
                                setExpanded(isExpanded ? null : task.id)
                              }}
                            >
                              {isExpanded ? '▲' : '▼'}
                            </button>
                          )}
                          {t.status === 'pending' && (
                            <button
                              className="text-[10px] text-garden-forest/60 hover:text-garden-forest font-medium"
                              onClick={(e) => {
                                if (editing) return
                                e.stopPropagation()
                                handleMakeup(task.id)
                              }}
                            >
                              补({Math.max(0, 3 - store.makeupsUsed)})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded sub-tasks */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-white/70 flex-1 overflow-auto rounded-xl bg-white/90 p-1">
                          {isGarden && task.subTasks.map((st) => {
                            const subKey = st.key as keyof SubTaskState | undefined
                            const done = subKey ? gardenSubs[subKey] : false
                            return (
                              <button
                                key={st.label}
                                className={`flex items-center justify-between rounded-lg px-2 py-1 text-[10px] w-full transition-colors ${
                                  done ? 'bg-green-50 text-green-700' : 'bg-white/40 text-gray-600 hover:bg-white/80'
                                }`}
                                onClick={(e) => {
                                  if (editing) return
                                  e.stopPropagation()
                                  if (subKey) {
                                    setGardenSubs((prev) => ({ ...prev, [subKey]: !prev[subKey] }))
                                  }
                                }}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <UiIcon name={done ? 'checkCircle' : 'square'} size={13} className={done ? 'text-green-600' : 'text-gray-400'} />
                                  {st.icon && <UiIcon name={st.icon} size={12} className="text-gray-500" />}
                                  {st.label}
                                </span>
                                <span className="text-garden-gold font-bold">+{st.xp}XP</span>
                              </button>
                            )
                          })}
                          {isGarden && gardenSubsAllDone && (
                            <p className="text-[10px] text-green-600 font-medium text-center mt-1 inline-flex items-center gap-1"><UiIcon name="party" size={13} />全部完成！</p>
                          )}

                          {!isGarden && task.subTasks.map((st) => (
                            <div key={st.label} className="flex items-center justify-between bg-white/40 rounded-lg px-2 py-1 text-[10px]">
                              <span className="text-gray-600">{st.label}</span>
                              <span className="text-garden-gold font-bold">+{st.xp}XP</span>
                            </div>
                          ))}

                          {task.id === 'task_water' && (
                            <div className="bg-white/40 rounded-lg px-2 py-1.5 flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-gray-500 inline-flex items-center gap-1"><UiIcon name="droplet" size={12} className="text-blue-500" />杯数：</span>
                              <button
                                className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs"
                                onClick={(e) => { e.stopPropagation(); setWaterCount(Math.max(0, waterCount - 1)) }}
                              >−</button>
                              <span className="text-xs font-bold text-gray-700">{waterCount}</span>
                              <button
                                className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs"
                                onClick={(e) => { e.stopPropagation(); setWaterCount(waterCount + 1) }}
                              >+</button>
                              <span className="text-[10px] text-gray-400">/ {stoolHealth === 'constipation' ? '8' : '6'}</span>
                              {waterCount >= (stoolHealth === 'constipation' ? 8 : 6) && (
                                <span className="text-[10px] text-green-600 font-bold inline-flex"><UiIcon name="check" size={13} /></span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DraggableBlock>

        {/* Calendar */}
        <DraggableBlock blockId="calendar" defaultPos={pos('calendar')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-xs font-bold text-gray-500 inline-flex items-center gap-1"><UiIcon name="calendar" size={14} />连续打卡日历</h3>
              <span className="text-[9px] font-bold text-white bg-red-400 rounded-full px-1.5 py-0.5">重要</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center shrink-0">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <span key={d} className="text-[10px] text-gray-400">{d}</span>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <span key={`empty-${i}`} className="text-[10px]" />
              ))}
              {calendarDays.map((d) => {
                const isToday = d === now.getDate()
                const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const st = calendarMap[dateStr]
                let cls = 'text-gray-400'
                let label = String(d)
                if (isToday) {
                  cls = 'bg-gradient-to-b from-orange-400 to-orange-500 text-white font-bold shadow ring-2 ring-orange-200'
                } else if (st === 'done') {
                  cls = 'bg-green-50 text-green-600'
                  label = '✓'
                } else if (st === 'makeup') {
                  cls = 'bg-amber-50 text-amber-600'
                  label = '补'
                } else if (st === 'miss') {
                  cls = 'text-gray-300 bg-gray-50'
                  label = '✗'
                }
                return (
                  <span
                    key={d}
                    className={`text-[10px] rounded-lg w-6 h-6 flex items-center justify-center mx-auto transition-all ${cls}`}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
            <div className="mt-auto pt-2.5 border-t border-amber-100 flex items-center justify-between shrink-0 gap-2">
              <span className="text-xs font-bold text-green-600 whitespace-nowrap">已连续打卡 {store.streak} 天</span>
              <span className="text-[10px] text-amber-600 text-right leading-tight inline-flex items-center gap-1"><UiIcon name="gift" size={12} />连续7天可获得神秘种子哦！</span>
            </div>
          </div>
        </DraggableBlock>

        {/* Rewards */}
        <DraggableBlock blockId="rewards" defaultPos={pos('rewards')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-4 h-full">
            <h3 className="text-xs font-bold text-gray-500 mb-3 inline-flex items-center gap-1"><UiIcon name="flower" size={14} />今日奖励</h3>
            <div className="grid grid-cols-2 gap-3">
              {REWARDS.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2.5 bg-gradient-to-b from-white/80 to-garden-cream rounded-2xl p-2.5 shadow-sm border border-white/80"
                >
                  <span className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${r.bg} text-white flex items-center justify-center shadow-md shrink-0`}>
                    <UiIcon name={r.icon} size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 font-medium leading-tight">{r.label}</p>
                    <p className={`text-sm font-bold ${r.color}`}>{r.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DraggableBlock>

        {/* Right AI panel */}
        <DraggableBlock blockId="assistant" defaultPos={pos('assistant')} editing={editing} movable resizable containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <img src="/assets/characters/png/char_xiaoyuan.png" alt="菌小园助手" className="w-10 h-10 object-contain shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-garden-forest">菌小园助手</h3>
                <p className="text-[10px] text-gray-400">你的打卡小帮手</p>
              </div>
            </div>
            <div className="bg-garden-cream rounded-xl rounded-bl-sm p-3 mb-3 shrink-0">
              <p className="text-xs text-gray-500 inline-flex items-start gap-1">
                <UiIcon name="message" size={13} className="mt-0.5 shrink-0" />
                <span>
                  {showReportBanner
                    ? '昨天的便便显示需要调整一下，今天重点关注饮食和水分哦！'
                    : '每天完成打卡，花园就会茁壮成长哦！'}
                </span>
              </p>
            </div>
            <div className="text-xs text-gray-500 mb-1.5 font-bold shrink-0 inline-flex items-center gap-1"><UiIcon name="lightbulb" size={13} className="text-amber-500" />今日小建议：</div>
            <ul className="text-xs text-gray-400 space-y-1 mb-3 shrink-0">
              {showReportBanner && stoolHealth === 'constipation' ? (
                <>
                  <li>• 多吃绿叶蔬菜和纤维食物</li>
                  <li>• 今天喝够8杯水</li>
                  <li>• 饭后散步15分钟</li>
                </>
              ) : showReportBanner && stoolHealth === 'diarrhea' ? (
                <>
                  <li>• 清淡饮食，避免生冷</li>
                  <li>• 注意腹部保暖</li>
                  <li>• 适量补充温水</li>
                </>
              ) : (
                <>
                  <li>• 先完成花园探索再吃饭</li>
                  <li>• 记得喝够6杯水</li>
                </>
              )}
            </ul>
            <div className="text-xs text-gray-500 mb-1.5 font-bold shrink-0 inline-flex items-center gap-1"><UiIcon name="book" size={13} />今日小知识：</div>
            <p className="text-xs text-gray-400 mb-3 shrink-0">
              肠道里有超过100万亿个微生物，它们帮助你消化食物、制造维生素！
            </p>
            <div className="flex gap-2 mt-auto shrink-0">
              <button
                className="text-xs text-garden-forest hover:underline bg-white/60 rounded-lg px-2 py-1.5"
                onClick={() => navigate('/classroom')}
              >
                <UiIcon name="book" size={13} className="inline mr-1 -mt-0.5 align-middle" />
                知识课堂
              </button>
              <button
                className="text-xs text-garden-forest hover:underline bg-white/60 rounded-lg px-2 py-1.5"
                onClick={() => navigate('/badges')}
              >
                <UiIcon name="trophy" size={13} className="inline mr-1 -mt-0.5 align-middle" />
                成长徽章
              </button>
            </div>
          </div>
        </DraggableBlock>
      </div>
    </div>
  )
}
