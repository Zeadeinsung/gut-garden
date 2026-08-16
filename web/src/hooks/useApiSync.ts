import { useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { useGardenStore } from '@/stores/gardenStore'
import { useBadgeStore } from '@/stores/badgeStore'
import { useClassroomStore } from '@/stores/classroomStore'
import { api } from '@/lib/api'
import { badgeIconUrl, normalizeBadgeCategory } from '@/lib/badgeIcons'
import type { TaskId, TaskStatus } from '@/types/checkin'

const TASK_CODE_TO_ID: Record<string, TaskId> = {
  explore: 'task_garden',
  eat: 'task_eat',
  sleep: 'task_sleep',
  water: 'task_water',
  sport: 'task_sport',
}

export interface TodayApi {
  checkin_date: string
  tasks: { code: string; name: string; status: string }[]
  all_completed: boolean
  streak: number
  longest_streak: number
  makeups_used: number
  stool_reported_today: boolean
  stool_report_banner: string | null
  task_eat_suggestion: string | null
}

export interface GardenApi {
  child_id: number
  current_state: string
  moisture_level: number
  growth_stage: number
  garden_xp: number
  interaction_count: number
  unlocked_features: string[]
  stage_label: string
}

interface BadgeDefApi {
  code: string
  name: string
  category: string
  description: string
}

interface BadgeAwardApi {
  id: number
  code: string
  name: string
  category: string
  description: string
  rarity: string
  awarded_at: string
}

interface ModuleApi {
  module_code: string
  name: string
  description: string
  cards_unlocked: number
  cards_total: number
  quizzes_passed: number
  quizzes_total: number
  animation_watched: boolean
  completed: boolean
}

export function getActiveChildId(): number | null {
  const { user } = useAuthStore.getState()
  return user?.active_child_id ?? null
}

export function isRegistered(): boolean {
  return useAuthStore.getState().mode === 'registered'
}

export function applyCheckinToday(data: TodayApi): void {
  useCheckinStore.setState({
    today: {
      date: data.checkin_date,
      tasks: data.tasks.map((t) => ({
        id: TASK_CODE_TO_ID[t.code] || (t.code as TaskId),
        status: (t.status === 'auto_done' ? 'done' : t.status) as TaskStatus,
      })),
      all_completed: data.all_completed,
    },
    streak: data.streak,
    makeupsUsed: data.makeups_used,
  })
}

export function applyGardenState(data: GardenApi): void {
  useGardenStore.setState({
    currentState: data.current_state as never,
    moistureLevel: data.moisture_level,
    gardenLevel: data.growth_stage,
    gardenXp: data.garden_xp,
    interactionCount: data.interaction_count,
  })
}

async function syncAll(childId: number) {
  const [today, garden, awarded, pending, defs, modules] = await Promise.all([
    api.get<TodayApi>(`/checkin/today?child_id=${childId}`),
    api.get<GardenApi>(`/garden/state?child_id=${childId}`),
    api.get<BadgeAwardApi[]>(`/badges/awarded?child_id=${childId}`),
    api.get<Record<string, unknown>[]>(`/badges/pending?child_id=${childId}`),
    api.get<BadgeDefApi[]>(`/badges/defs`),
    api.get<ModuleApi[]>(`/classroom/modules?child_id=${childId}`),
  ])

  applyCheckinToday(today)
  applyGardenState(garden)

  useBadgeStore.setState({
    awarded: awarded.map((a) => ({
      id: a.id,
      badge_id: a.id,
      code: a.code,
      name: a.name,
      rarity: a.rarity as never,
      awarded_at: a.awarded_at,
    })),
    pending: pending as never,
    defs: defs.map((d, i) => ({
      id: i + 1,
      code: d.code,
      name: d.name,
      description: d.description,
      category: normalizeBadgeCategory(d.category),
      icon_url: badgeIconUrl(d.code),
    })),
  })

  useClassroomStore.setState({
    modules: modules.map((m) => ({
      code: m.module_code,
      title: m.name,
      description: m.description,
      card_count: m.cards_total,
      quiz_count: m.quizzes_total,
      progress: m.quizzes_total ? Math.round((m.quizzes_passed / m.quizzes_total) * 100) : 0,
      unlocked: m.cards_unlocked > 0 || m.completed,
      stars: m.quizzes_passed,
    })),
  })
}

export function useApiSync() {
  const mode = useAuthStore((s) => s.mode)
  const childId = useAuthStore((s) => s.user?.active_child_id ?? null)

  useEffect(() => {
    if (mode !== 'registered' || !childId) return
    let cancelled = false
    syncAll(childId).catch(() => { if (!cancelled) console.warn('[useApiSync] sync failed') })
    return () => { cancelled = true }
  }, [mode, childId])

  return useCallback(() => {
    const id = getActiveChildId()
    if (isRegistered() && id) return syncAll(id)
    return Promise.resolve()
  }, [])
}
