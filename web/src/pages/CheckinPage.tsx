import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckinStore } from '@/stores/checkinStore'
import { useGardenStore } from '@/stores/gardenStore'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { sfx } from '@/lib/sound'
import { applyCheckinToday, isRegistered, getActiveChildId, type TodayApi } from '@/hooks/useApiSync'
import type { TaskId, TaskStatus } from '@/types/checkin'
import TopHeader from '@/components/checkin/TopHeader'
import LevelCard from '@/components/checkin/LevelCard'
import EnergyCard from '@/components/checkin/EnergyCard'
import GardenPreviewCard from '@/components/checkin/GardenPreviewCard'
import CareTaskCard from '@/components/checkin/CareTaskCard'
import GardenGrowthCard from '@/components/checkin/GardenGrowthCard'
import StreakCalendar from '@/components/checkin/StreakCalendar'
import DailyReward from '@/components/checkin/DailyReward'
import GardenAssistant from '@/components/checkin/GardenAssistant'
import '@/styles/checkin-dashboard.css'

/* ------------------------------------------------------------------ */
/*  数据                                                                */
/* ------------------------------------------------------------------ */

const STAGE_NAMES = ['幼苗期', '成长期', '繁荣期', '茂盛期', '丰收期', '守护期']
const XP_PER_LEVEL = 120

type StoolHealth = 'normal' | 'constipation' | 'diarrhea' | 'none'

interface TaskCardDef {
  id: TaskId
  label: string
  img: string
  gradient: 'water' | 'diet' | 'sleep' | 'exercise' | 'garden'
  accent: string
  xp: number
  tips: { healthy: string; constipation: string; diarrhea: string; normal: string }
  subTasks?: { key: string; label: string }[]
}

const TASKS: TaskCardDef[] = [
  {
    id: 'task_water', label: '补充水分', img: '/assets/tasks/task_char_water.webp', gradient: 'water', accent: '#58b9df', xp: 5,
    tips: { healthy: '喝水习惯很棒！', constipation: '今天目标：8杯水 多喝水能软化便便哦！', diarrhea: '适量饮水补充水分，今天目标：6杯水', normal: '记得喝够6杯水哦！' },
  },
  {
    id: 'task_eat', label: '健康饮食', img: '/assets/tasks/task_char_eat.webp', gradient: 'diet', accent: '#8bc34a', xp: 10,
    tips: { healthy: '继续保持均衡饮食！', constipation: '多吃绿叶蔬菜和纤维食物，试试蒸煮替代油炸～', diarrhea: '清淡饮食为主，避免生冷油腻食物～', normal: '今天吃好了吗？记得吃蔬菜水果哦！' },
  },
  {
    id: 'task_sleep', label: '优质睡眠', img: '/assets/tasks/task_char_sleep.webp', gradient: 'sleep', accent: '#a56bd4', xp: 8,
    tips: { healthy: '睡眠质量很好！', constipation: '作息不规律也会影响便便，今晚试试21:30前上床～', diarrhea: '报告显示作息波动，好好休息有助于肠道恢复～', normal: '昨晚睡得好吗？早睡早起身体棒！' },
  },
  {
    id: 'task_sport', label: '活力运动', img: '/assets/tasks/task_char_sport.webp', gradient: 'exercise', accent: '#f5bd35', xp: 5,
    tips: { healthy: '运动让肠道更健康！', constipation: '运动能促进肠道蠕动，今天动起来吧！', diarrhea: '适度活动有助恢复，不要剧烈运动哦～', normal: '今天动起来了吗？' },
  },
  {
    id: 'task_garden', label: '探索花园', img: '/assets/tasks/task_char_garden.webp', gradient: 'garden', accent: '#4CAF50', xp: 10,
    tips: { healthy: '花园状态良好，继续探索吧！', constipation: '便便有点干硬，来花园看看怎么改善吧！', diarrhea: '便便有点稀，来花园学习调理方法吧！', normal: '花园需要你的照顾，快来探索吧！' },
    subTasks: [
      { key: 'gardenGame', label: '小游戏' },
      { key: 'gardenVideo', label: '视频课' },
      { key: 'gardenQuiz', label: '常识题×3' },
    ],
  },
]

const TASK_ID_TO_CODE: Partial<Record<TaskId, string>> = {
  task_eat: 'eat',
  task_sleep: 'sleep',
  task_water: 'water',
  task_sport: 'sport',
}

/* ------------------------------------------------------------------ */
/*  工具函数                                                            */
/* ------------------------------------------------------------------ */

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function fmtLocalKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getTodayKey(): string {
  return fmtLocalKey(new Date())
}

function getDefaultToday() {
  return {
    date: getTodayKey(),
    tasks: TASKS.map((t) => ({ id: t.id, status: 'pending' as TaskStatus })),
    all_completed: false,
  }
}

function getYesterdayStoolHealth(): StoolHealth {
  try {
    const saved = localStorage.getItem('gg-stool-logs')
    if (!saved) return 'none'
    const logs = JSON.parse(saved)
    const y = new Date()
    y.setDate(y.getDate() - 1)
    const yesterday = fmtLocalKey(y)
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

function getTaskTip(task: TaskCardDef, stoolHealth: StoolHealth, isDone: boolean): string {
  if (isDone) return task.tips.healthy
  switch (stoolHealth) {
    case 'constipation': return task.tips.constipation
    case 'diarrhea': return task.tips.diarrhea
    default: return task.tips.normal
  }
}

/* ------------------------------------------------------------------ */
/*  编辑模式坐标（REF 1920×1150 画布，普通模式换算为百分比）             */
/* ------------------------------------------------------------------ */

const REF_W = 1920
const REF_H = 1020
const CHECKIN_REF = { w: REF_W, h: REF_H }

const pLeft = (x: number) => `${((x / REF_W) * 100).toFixed(2)}%`
const pTop = (y: number) => `${((y / REF_H) * 100).toFixed(2)}%`
const pWidth = (w: number) => `${((w / REF_W) * 100).toFixed(2)}%`
const pHeight = (h: number) => `${((h / REF_H) * 100).toFixed(2)}%`

const CHECKIN_DEFAULTS: Record<string, BlockPos> = {
  levelCard:     { x: 40,   y: 0,    w: 260,  h: 168 },
  energyCard:    { x: 318,  y: 0,    w: 876,  h: 168 },
  gardenPreview: { x: 1212, y: 0,    w: 210,  h: 168 },
  careSection:   { x: 40,   y: 178,  w: 1400, h: 540 },
  gardenGrowth:  { x: 40,   y: 728,  w: 366,  h: 290 },
  streakCalendar:{ x: 426,  y: 728,  w: 610,  h: 290 },
  dailyReward:   { x: 1056, y: 728,  w: 366,  h: 290 },
  assistant:     { x: 1450, y: 0,    w: 430,  h: 1018 },
}

/** 旧版「4 个大容器」布局 → 新版「每张卡片独立」布局的迁移 */
function migrateCheckinLayout(merged: Record<string, BlockPos>, _version: number): Record<string, BlockPos> {
  const next = { ...merged }
  if (merged.topStatus) {
    const { x, y, w, h } = merged.topStatus
    const energyW = Math.max(100, w - 260 - 210 - 36)
    next.levelCard = { x, y, w: 260, h }
    next.energyCard = { x: x + 260 + 18, y, w: energyW, h }
    next.gardenPreview = { x: x + 260 + 18 + energyW + 18, y, w: 210, h }
    delete next.topStatus
  }
  if (merged.bottomGrid) {
    const { x, y, w, h } = merged.bottomGrid
    const avail = Math.max(100, w - 40)
    const c0 = Math.round((0.9 / 3.3) * avail)
    const c1 = Math.round((1.5 / 3.3) * avail)
    const c2 = Math.max(0, w - c0 - c1 - 40)
    next.gardenGrowth = { x, y, w: c0, h }
    next.streakCalendar = { x: x + c0 + 20, y, w: c1, h }
    next.dailyReward = { x: x + c0 + 20 + c1 + 20, y, w: c2, h }
    delete next.bottomGrid
  }
  return next
}

/* ------------------------------------------------------------------ */
/*  页面                                                                */
/* ------------------------------------------------------------------ */

export default function CheckinPage() {
  const navigate = useNavigate()
  const store = useCheckinStore()
  const { gardenLevel, gardenXp, moistureLevel } = useGardenStore()
  const { editing, containerRef, pos, handleMove, handleResize, handleReset } = useEditorPage('checkin', CHECKIN_DEFAULTS, { init: migrateCheckinLayout })
  const [gardenSubs, setGardenSubs] = useState<{ gardenGame: boolean; gardenVideo: boolean; gardenQuiz: boolean }>({
    gardenGame: false, gardenVideo: false, gardenQuiz: false,
  })

  const stoolHealth = useMemo(() => getYesterdayStoolHealth(), [])

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
  const completedCount = today.tasks.filter((t) => t.status === 'done' || t.status === 'makeup').length
  const energy = (completedCount / TASKS.length) * 100

  const stageIndex = clamp((gardenLevel || 1) - 1, 0, STAGE_NAMES.length - 1)
  const stageName = STAGE_NAMES[stageIndex]
  const xpPct = clamp(((gardenXp || 0) % XP_PER_LEVEL) / XP_PER_LEVEL * 100, 0, 100)
  const xpToNext = XP_PER_LEVEL - ((gardenXp || 0) % XP_PER_LEVEL)
  const plantGrowth = clamp(Math.round(((gardenLevel || 1) - 1) * 18 + ((gardenXp || 0) % XP_PER_LEVEL) / XP_PER_LEVEL * 30), 0, 100)
  const vitality = clamp(Math.round((moistureLevel || 0) * 0.7 + 50), 0, 100)
  const weekLabel = store.streak >= 7 ? '优秀' : store.streak >= 3 ? '良好' : store.streak >= 1 ? '加油' : '待开始'

  /* ── 交互 ── */
  const handleToggle = useCallback((taskId: TaskId) => {
    if (isRegistered()) {
      if (taskId === 'task_garden') {
        navigate('/garden')
        return
      }
      const code = TASK_ID_TO_CODE[taskId]
      const childId = getActiveChildId()
      if (!code || !childId) {
        console.warn('[checkin] 缺少 task_code/child_id', { taskId, code, childId })
        toast('账号数据异常，请退出后重新登录', 'error')
        return
      }
      api
        .post<TodayApi & { badges_awarded?: unknown }>('/checkin/confirm-task', { child_id: childId, task_code: code })
        .then((data) => {
          applyCheckinToday(data)
          if (data.all_completed) {
            sfx.celebrate()
            toast('太棒了！今日全部完成！', 'success')
          } else {
            sfx.success()
          }
        })
        .catch((err: unknown) => {
          console.error('[checkin] confirm-task 失败', err)
          const msg = err instanceof Error && err.message ? err.message : '打卡失败，请重试'
          toast(msg, 'error')
        })
      return
    }

    if (taskId === 'task_garden' && !gardenSubsAllDone) return

    const st = useCheckinStore.getState()
    if (!st.today) return
    const prevAll = st.today.tasks.every((t) => t.status === 'done' || t.status === 'makeup')
    const tasks = st.today.tasks.map((t) => {
      if (t.id !== taskId) return t
      const next: TaskStatus = t.status === 'done' ? 'pending' : 'done'
      return { ...t, status: next }
    })
    const allDone = tasks.every((t) => t.status === 'done' || t.status === 'makeup')
    const toggled = tasks.find((t) => t.id === taskId)
    st.setToday({ ...st.today, tasks, all_completed: allDone })
    if (allDone && !prevAll) {
      st.setStreak(st.streak + 1)
      sfx.celebrate()
      toast('太棒了！今日全部完成！', 'success')
    } else if (toggled && (toggled.status === 'done' || toggled.status === 'makeup')) {
      sfx.success()
    }
  }, [gardenSubsAllDone, navigate])

  const handleToggleSub = useCallback((key: string) => {
    setGardenSubs((prev) => ({ ...prev, [key as keyof typeof prev]: !prev[key as keyof typeof prev] }))
  }, [])

  /* ── 编辑块渲染：普通模式用百分比定位，编辑模式用 DraggableBlock ── */
  const renderBlock = (id: string, movable: boolean, resizable: boolean, children: ReactNode) => {
    if (editing) {
      return (
        <DraggableBlock
          blockId={id}
          defaultPos={pos(id)}
          editing
          movable={movable}
          resizable={resizable}
          containerRef={containerRef}
          refSize={CHECKIN_REF}
          onMove={handleMove}
          onResize={handleResize}
        >
          {children}
        </DraggableBlock>
      )
    }
    const p = pos(id)
    return (
      <div className="absolute" style={{ left: pLeft(p.x), top: pTop(p.y), width: pWidth(p.w), height: pHeight(p.h) }}>
        {children}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gg-card-border-055">
      <TopHeader />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium flex items-center justify-center gap-3 shrink-0">
          <span>Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit</span>
          <button className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[11px] transition-colors" onClick={handleReset}>
            Reset All
          </button>
        </div>
      )}

      {/* 画布 */}
      <div ref={containerRef} className="flex-1 relative min-h-0">
        {/* 顶部：生态等级 + 能量 + 花园预览 */}
        {renderBlock('levelCard', true, true, <LevelCard level={gardenLevel || 1} stageName={stageName} />)}
        {renderBlock('energyCard', true, true, <EnergyCard energy={energy} />)}
        {renderBlock('gardenPreview', true, true, <GardenPreviewCard level={gardenLevel || 1} />)}

        {/* 今日照顾清单 */}
        {renderBlock('careSection', true, true, (
          <div className="h-full flex flex-col p-[18px] overflow-hidden relative">
            <img src="/assets/tasks/task_bg.png" alt="" className="absolute inset-0 w-full h-full object-fill" draggable={false} />
            <h2 className="relative z-10 text-center text-[18px] font-bold text-gray-700 mb-[12px] shrink-0">今日照顾清单</h2>
            <div className="relative z-10 grid grid-cols-5 gap-[10px] flex-1 min-h-0">
              {TASKS.map((task) => {
                const t = today.tasks.find((x) => x.id === task.id)
                const status = t?.status ?? 'pending'
                const isDone = status === 'done' || status === 'makeup'
                const tip = getTaskTip(task, stoolHealth, isDone)
                const gardenSubItems = task.id === 'task_garden'
                  ? task.subTasks!.map((s) => ({ ...s, done: gardenSubs[s.key as keyof typeof gardenSubs] }))
                  : undefined
                return (
                  <CareTaskCard
                    key={task.id}
                    id={task.id}
                    label={task.label}
                    img={task.img}
                    gradient={task.gradient}
                    accent={task.accent}
                    xp={task.xp}
                    status={status}
                    tip={tip}
                    gardenSubs={gardenSubItems}
                    allGardenDone={gardenSubsAllDone}
                    editing={editing}
                    onToggle={() => handleToggle(task.id)}
                    onToggleSub={task.id === 'task_garden' ? handleToggleSub : undefined}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* 底部：花园成长 + 连续打卡 + 今日奖励 */}
        {renderBlock('gardenGrowth', true, true, (
          <GardenGrowthCard
            level={gardenLevel || 1}
            stageName={stageName}
            xpToNext={xpToNext}
            xpPct={xpPct}
            plantGrowth={plantGrowth}
            vitality={vitality}
            weekLabel={weekLabel}
          />
        ))}
        {renderBlock('streakCalendar', true, true, <StreakCalendar streak={store.streak} />)}
        {renderBlock('dailyReward', true, true, <DailyReward />)}

        {/* 右侧菌小园助手 */}
        {renderBlock('assistant', true, true, (
          <GardenAssistant
            careDone={completedCount}
            total={TASKS.length}
            stoolHealth={stoolHealth}
            onClassroom={() => navigate('/classroom')}
            onBadges={() => navigate('/badges')}
          />
        ))}
      </div>
    </div>
  )
}
