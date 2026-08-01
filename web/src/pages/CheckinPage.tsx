import { useCallback, useMemo } from 'react'
import { useCheckinStore } from '@/stores/checkinStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { toast } from '@/components/ui/Toast'
import type { TaskId, TaskStatus } from '@/types/checkin'

const TASKS: { id: TaskId; label: string; icon: string; color: string }[] = [
  { id: 'task_garden', label: '逛花园', icon: '🌱', color: 'bg-green-400' },
  { id: 'task_eat', label: '好好吃饭', icon: '🍽️', color: 'bg-orange-400' },
  { id: 'task_sleep', label: '早睡早起', icon: '😴', color: 'bg-purple-400' },
  { id: 'task_water', label: '多喝水', icon: '💧', color: 'bg-blue-400' },
  { id: 'task_sport', label: '户外运动', icon: '⚽', color: 'bg-red-400' },
]

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function getDefaultToday() {
  return {
    date: getTodayKey(),
    tasks: TASKS.map((t) => ({ id: t.id, status: 'pending' as TaskStatus })),
    all_completed: false,
  }
}

export default function CheckinPage() {
  const store = useCheckinStore()

  const today = useMemo(() => {
    const key = getTodayKey()
    if (!store.today || store.today.date !== key) {
      const fresh = getDefaultToday()
      store.setToday(fresh)
      return fresh
    }
    return store.today
  }, [store.today])

  const completedCount = today.tasks.filter((t) => t.status === 'done').length
  const allDone = completedCount === TASKS.length
  const pct = (completedCount / TASKS.length) * 100

  const toggleTask = useCallback((taskId: TaskId) => {
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
  }, [])

  const handleMakeup = useCallback((taskId: TaskId) => {
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
      case 'done': return 'border-green-400 bg-green-50'
      case 'makeup': return 'border-yellow-400 bg-yellow-50'
      case 'skipped': return 'border-gray-300 bg-gray-50 opacity-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  return (
    <div className="flex flex-col h-full pb-20 px-4">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-garden-forest">每日打卡</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm text-gray-400">{today.date}</span>
          <span className="text-sm font-bold text-garden-gold">
            🔥 {store.streak}天连续
          </span>
        </div>
        <div className="mt-4 mx-auto max-w-xs">
          <ProgressBar value={completedCount} max={TASKS.length} color={allDone ? 'bg-garden-gold' : 'bg-garden-forest'} />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {allDone ? '全部完成！' : `${completedCount}/${TASKS.length} 已完成`}
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
        {TASKS.map((task) => {
          const t = today.tasks.find((x) => x.id === task.id)!
          const statusStyle = getTaskStyle(t.status)

          return (
            <div key={task.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${statusStyle}`}>
              <button
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform active:scale-90 ${
                  t.status === 'done' || t.status === 'makeup'
                    ? task.color + ' text-white shadow-md'
                    : 'bg-gray-100'
                }`}
                onClick={() => toggleTask(task.id)}
              >
                {task.icon}
              </button>
              <div className="flex-1">
                <p className={`font-bold ${t.status === 'done' ? 'text-green-700' : 'text-gray-700'}`}>
                  {task.label}
                </p>
                {t.status === 'done' && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 bg-green-100 text-green-700">✅</span>
                )}
                {t.status === 'makeup' && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full mt-1 bg-yellow-100 text-yellow-700">🔧 补卡</span>
                )}
              </div>
              {t.status === 'pending' && (
                <button
                  className="text-xs text-garden-forest/60 hover:text-garden-forest font-medium"
                  onClick={() => handleMakeup(task.id)}
                >
                  补卡({Math.max(0, 3 - store.makeupsUsed)})
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        本周剩余补卡机会：{Math.max(0, 3 - store.makeupsUsed)}次
      </p>
    </div>
  )
}
