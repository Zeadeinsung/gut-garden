import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  children,
  gardenStates,
  checkinRecords,
  checkinCalendar,
  badgeDefs,
  badgeAwards,
  knowledgeModuleProgress,
  stoolAnalyses,
} from '../../db/schema/index.js'
import { toChildProfile, type ChildProfile } from '../../lib/mappers.js'
import { throwError } from '../../config/errors'

export interface GuestMigratePayload {
  child: { nickname: string; age: number; avatar_url?: string }
  data?: {
    garden?: { current_state?: string; moisture_level?: number; garden_xp?: number; growth_stage?: number }
    checkin?: { streak?: number; makeups_used?: number; today?: { date?: string; tasks?: { id?: string; status?: string }[] } }
    badges?: { awarded?: { code: string; rarity?: string; awarded_at?: string }[] }
    classroom?: { modules?: { module_code: string; cards_unlocked?: number; quizzes_passed?: number; completed?: boolean }[] }
    stool?: { stool_icon_type?: string; bristol_type?: number }[]
  }
}

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function migrateGuest(parentId: number, payload: GuestMigratePayload): Promise<ChildProfile> {
  if (!payload?.child || payload.child.age < 3 || payload.child.age > 10) {
    throwError('CHILD_002')
  }

  const childId = await db.transaction(async (tx) => {
    const [child] = await tx
      .insert(children)
      .values({
        parentId,
        nickname: payload.child.nickname,
        age: payload.child.age,
        dailyLimitMinutes: 30,
        avatarUrl: payload.child.avatar_url || null,
      })
      .returning()
    const cid = child.id

    const g = payload.data?.garden || {}
    await tx
      .insert(gardenStates)
      .values({
        childId: cid,
        currentState: (g.current_state as never) || 'healthy',
        moistureLevel: Math.min(100, Math.max(0, g.moisture_level ?? 50)),
        growthStage: Math.min(6, Math.max(1, g.growth_stage ?? 1)),
        gardenXp: g.garden_xp ?? 0,
      })
      .onConflictDoNothing()

    const todayStr = payload.data?.checkin?.today?.date || fmtDate(new Date())
    const streak = payload.data?.checkin?.streak || 0

    // Backfill streak days (ending yesterday) + today if present
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const backfillDays = Math.max(0, streak - (payload.data?.checkin?.today ? 1 : 0))
    for (let i = 1; i <= backfillDays; i++) {
      const d = new Date(end)
      d.setDate(d.getDate() - i)
      const ds = fmtDate(d)
      await tx
        .insert(checkinRecords)
        .values({ childId: cid, checkinDate: ds, taskGarden: 'auto_done', taskEat: 'done', taskSleep: 'done', completedAt: d })
        .onConflictDoNothing()
      await tx
        .insert(checkinCalendar)
        .values({ childId: cid, calendarDate: ds, status: 'done' })
        .onConflictDoNothing()
    }

    const todayTasks = payload.data?.checkin?.today?.tasks
    if (todayTasks && todayTasks.length) {
      const status = (id: string, fallback: 'pending' | 'auto_done' | 'done'): 'pending' | 'auto_done' | 'done' => {
        const t = todayTasks.find((x) => x.id === id)
        if (!t) return fallback
        if (t.status === 'done' || t.status === 'auto_done' || t.status === 'pending') return t.status
        return fallback
      }
      const values = {
        childId: cid,
        checkinDate: todayStr,
        taskGarden: status('task_garden', 'auto_done'),
        taskEat: status('task_eat', 'done'),
        taskSleep: status('task_sleep', 'done'),
        taskWater: status('task_water', 'pending'),
        taskSport: status('task_sport', 'pending'),
      }
      const todayAllDone = [values.taskGarden, values.taskEat, values.taskSleep, values.taskWater, values.taskSport].every(
        (s) => s === 'done' || s === 'auto_done'
      )
      await tx.insert(checkinRecords).values(values).onConflictDoNothing()
      await tx
        .insert(checkinCalendar)
        .values({ childId: cid, calendarDate: todayStr, status: todayAllDone ? 'done' : 'miss' })
        .onConflictDoNothing()
    }

    const awarded = payload.data?.badges?.awarded || []
    if (awarded.length) {
      const defs = await tx.select().from(badgeDefs)
      const byCode = new Map(defs.map((d) => [d.code, d]))
      for (const a of awarded) {
        const def = byCode.get(a.code)
        if (!def) continue
        const rarity = (a.rarity as never) || 'bronze'
        const eventId = `migrate:${cid}:${def.code}:${rarity}`
        await tx
          .insert(badgeAwards)
          .values({
            childId: cid,
            badgeDefId: def.id,
            rarity,
            eventId,
            awardedAt: a.awarded_at ? new Date(a.awarded_at) : new Date(),
          })
          .onConflictDoNothing()
      }
    }

    const modules = payload.data?.classroom?.modules || []
    for (const m of modules) {
      await tx
        .insert(knowledgeModuleProgress)
        .values({
          childId: cid,
          moduleCode: m.module_code,
          cardsUnlocked: m.cards_unlocked ?? 0,
          cardsTotal: 5,
          quizzesPassed: m.quizzes_passed ?? 0,
          completedAt: m.completed ? new Date() : null,
        })
        .onConflictDoNothing()
    }

    const stools = payload.data?.stool || []
    for (const s of stools) {
      await tx
        .insert(stoolAnalyses)
        .values({
          childId: cid,
          mode: 'icon_selection',
          stoolIconType: s.stool_icon_type || null,
          bristolType: s.bristol_type ?? null,
        })
        .onConflictDoNothing()
    }

    return cid
  }).catch((err) => {
    if ((err as { code?: string }).code === '23505' || (err as { message?: string }).message?.includes('duplicate')) {
      throwError('MIGRATE_001')
    }
    throw err
  })

  const row = (await db.select().from(children).where(eq(children.id, childId)))[0]
  return toChildProfile(row)
}
