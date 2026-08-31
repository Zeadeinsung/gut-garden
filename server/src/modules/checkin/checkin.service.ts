import { and, eq, desc, inArray, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { checkinRecords, checkinCalendar, gardenStates } from '../../db/schema/index.js'
import { todayInteractionCount, todayLocal } from '../garden/garden.service.js'
import { getRecentStool } from '../stool/stool.service.js'
import { onCheckinEvent } from '../badges/badge-hooks.js'
import { throwError } from '../../config/errors.js'

const TASK_DEFS: { code: string; name: string; column: 'taskGarden' | 'taskEat' | 'taskSleep' | 'taskWater' | 'taskSport' }[] = [
  { code: 'explore', name: '探索花园', column: 'taskGarden' },
  { code: 'eat', name: '健康饮食', column: 'taskEat' },
  { code: 'sleep', name: '优质睡眠', column: 'taskSleep' },
  { code: 'water', name: '补充水分', column: 'taskWater' },
  { code: 'sport', name: '活力运动', column: 'taskSport' },
]

const CONFIRMABLE = new Set(['eat', 'sleep', 'water', 'sport'])
const TASK_XP = 10
const SUB_ITEM_XP = 2

const SUB_ITEM_MAP = {
  water: 'subWater',
  vegetable: 'subVegetable',
  fruit: 'subFruit',
  outdoor: 'subOutdoor',
  early_sleep: 'subEarlySleep',
} as const

type TaskColumn = (typeof TASK_DEFS)[number]['column']

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function getOrCreateToday(childId: number) {
  const today = todayLocal()
  let row = (await db.select().from(checkinRecords).where(and(eq(checkinRecords.childId, childId), eq(checkinRecords.checkinDate, today))))[0]
  if (!row) {
    const [created] = await db
      .insert(checkinRecords)
      .values({ childId, checkinDate: today })
      .returning()
    row = created
  }
  return row
}

async function autoDetectGarden(childId: number, date: string): Promise<void> {
  const [record] = await db.select().from(checkinRecords).where(and(eq(checkinRecords.childId, childId), eq(checkinRecords.checkinDate, date)))
  if (!record || record.taskGarden !== 'pending') return
  const count = await todayInteractionCount(childId)
  if (count >= 3) {
    await db.update(checkinRecords).set({ taskGarden: 'auto_done' }).where(eq(checkinRecords.id, record.id))
  }
}

export async function computeStreaks(childId: number): Promise<{ streak: number; longestStreak: number }> {
  const rows = await db
    .select({ calendarDate: checkinCalendar.calendarDate })
    .from(checkinCalendar)
    .where(and(eq(checkinCalendar.childId, childId), inArray(checkinCalendar.status, ['done', 'makeup'])))
    .orderBy(checkinCalendar.calendarDate)

  const dates = new Set(rows.map((r) => r.calendarDate))
  if (dates.size === 0) return { streak: 0, longestStreak: 0 }

  let longest = 0
  let run = 0
  let prevDate: Date | null = null
  for (const d of rows.map((r) => r.calendarDate)) {
    const cur = new Date(d)
    if (prevDate) {
      const expected = new Date(prevDate)
      expected.setDate(expected.getDate() + 1)
      run = cur.getTime() === expected.getTime() ? run + 1 : 1
    } else {
      run = 1
    }
    if (run > longest) longest = run
    prevDate = cur
  }

  let current = 0
  const walk = new Date()
  walk.setHours(0, 0, 0, 0)
  if (!dates.has(fmtDate(walk))) walk.setDate(walk.getDate() - 1)
  while (dates.has(fmtDate(walk))) {
    current += 1
    walk.setDate(walk.getDate() - 1)
  }

  return { streak: current, longestStreak: longest }
}

async function countMakeupsThisMonth(childId: number, monthPrefix: string): Promise<number> {
  const rows = await db
    .select({ checkinDate: checkinRecords.checkinDate })
    .from(checkinRecords)
    .where(and(eq(checkinRecords.childId, childId), eq(checkinRecords.isMakeup, true)))
  return rows.filter((r) => r.checkinDate.startsWith(monthPrefix)).length
}

function isDoneStatus(status: string): boolean {
  return status === 'done' || status === 'auto_done'
}

async function isDayCompleted(childId: number, date: string): Promise<boolean> {
  const [record] = await db.select().from(checkinRecords).where(and(eq(checkinRecords.childId, childId), eq(checkinRecords.checkinDate, date)))
  if (!record) return false
  return TASK_DEFS.every((def) => isDoneStatus(record[def.column]))
}

async function syncCalendar(childId: number, date: string): Promise<void> {
  const [record] = await db.select().from(checkinRecords).where(and(eq(checkinRecords.childId, childId), eq(checkinRecords.checkinDate, date)))
  if (!record) return
  const done = TASK_DEFS.every((def) => isDoneStatus(record[def.column]))
  const subCount = [record.subWater, record.subVegetable, record.subFruit, record.subOutdoor, record.subEarlySleep].filter(Boolean).length
  await db
    .insert(checkinCalendar)
    .values({ childId, calendarDate: date, status: done ? 'done' : record.isMakeup ? 'makeup' : 'miss', subItemsCompleted: subCount })
    .onConflictDoUpdate({
      target: [checkinCalendar.childId, checkinCalendar.calendarDate],
      set: { status: done ? 'done' : record.isMakeup ? 'makeup' : 'miss', subItemsCompleted: subCount },
    })
}

async function markCompletedIfAllDone(childId: number, date: string): Promise<boolean> {
  const [record] = await db.select().from(checkinRecords).where(and(eq(checkinRecords.childId, childId), eq(checkinRecords.checkinDate, date)))
  const allDone = TASK_DEFS.every((def) => isDoneStatus(record[def.column]))
  if (allDone && !record.completedAt) {
    await db.update(checkinRecords).set({ completedAt: new Date() }).where(eq(checkinRecords.id, record.id))
  }
  return allDone
}

function buildStoolBanner(stool: { uploadedAt: Date; diagnosis: string | null; bristolType: number | null; taskSuggestion: string | null }): string {
  const prefix = fmtDate(stool.uploadedAt) === todayLocal() ? '今日便便观察' : '最近便便观察'
  const type = stool.bristolType ? `Type ${stool.bristolType} ` : ''
  if (stool.diagnosis) return `${prefix}：${type}${stool.diagnosis}${stool.taskSuggestion ? ` ${stool.taskSuggestion}` : ''}`
  if (stool.bristolType) return `${prefix}：Bristol ${stool.bristolType} 型`
  return `${prefix}：记录一条便便`
}

export async function getToday(childId: number) {
  const record = await getOrCreateToday(childId)
  await autoDetectGarden(childId, record.checkinDate)
  const [fresh] = await db.select().from(checkinRecords).where(eq(checkinRecords.id, record.id))

  const tasks = TASK_DEFS.map((def) => ({
    code: def.code,
    name: def.name,
    status: fresh[def.column],
  }))

  const { streak, longestStreak } = await computeStreaks(childId)
  const makeupsUsed = await countMakeupsThisMonth(childId, fresh.checkinDate.slice(0, 7))
  const stool = await getRecentStool(childId)
  const allCompleted = tasks.every((t) => isDoneStatus(t.status))
  const eatDone = isDoneStatus(fresh.taskEat)
  const taskEatSuggestion = stool?.taskSuggestion ? (eatDone ? `明日建议：${stool.taskSuggestion}` : stool.taskSuggestion) : null

  return {
    checkin_date: fresh.checkinDate,
    tasks,
    all_completed: allCompleted,
    streak,
    longest_streak: longestStreak,
    makeups_used: makeupsUsed,
    stool_reported_today: Boolean(stool && fmtDate(stool.uploadedAt) === todayLocal()),
    stool_report_banner: stool ? buildStoolBanner(stool) : null,
    task_eat_suggestion: taskEatSuggestion,
  }
}

export async function confirmTask(childId: number, taskCode: string) {
  if (!CONFIRMABLE.has(taskCode)) throwError('CHECKIN_003')
  const def = TASK_DEFS.find((d) => d.code === taskCode)!
  const record = await getOrCreateToday(childId)
  if (isDoneStatus(record[def.column])) return getToday(childId)

  await db.transaction(async (tx) => {
    const patch = { [def.column]: 'done' } as Record<TaskColumn, string>
    await tx.update(checkinRecords).set(patch as never).where(eq(checkinRecords.id, record.id))
    const [gs] = await tx.select({ gardenXp: gardenStates.gardenXp }).from(gardenStates).where(eq(gardenStates.childId, childId))
    await tx.update(gardenStates).set({ gardenXp: (gs?.gardenXp ?? 0) + TASK_XP }).where(eq(gardenStates.childId, childId))
  })

  await markCompletedIfAllDone(childId, record.checkinDate)
  await syncCalendar(childId, record.checkinDate)
  const badges = await onCheckinEvent(childId)
  const today = await getToday(childId)
  return { ...today, badges_awarded: badges }
}

export async function toggleSubItem(childId: number, subItem: string) {
  const key = SUB_ITEM_MAP[subItem as keyof typeof SUB_ITEM_MAP]
  if (!key) throwError('CHECKIN_003')
  const record = await getOrCreateToday(childId)
  const current = Boolean(record[key])
  const patch = { [key]: !current } as Record<string, boolean>

  await db.transaction(async (tx) => {
    await tx.update(checkinRecords).set(patch as never).where(eq(checkinRecords.id, record.id))
    if (!current) {
      const [gs] = await tx.select({ gardenXp: gardenStates.gardenXp }).from(gardenStates).where(eq(gardenStates.childId, childId))
      await tx.update(gardenStates).set({ gardenXp: (gs?.gardenXp ?? 0) + SUB_ITEM_XP }).where(eq(gardenStates.childId, childId))
    }
  })

  await syncCalendar(childId, record.checkinDate)
  const badges = await onCheckinEvent(childId)
  const today = await getToday(childId)
  return { ...today, badges_awarded: badges }
}

export async function skipEatSuggestion(childId: number, reason?: string) {
  const record = await getOrCreateToday(childId)
  await db
    .update(checkinRecords)
    .set({ taskEatSkipped: true, taskEatSkipReason: reason || 'other' })
    .where(eq(checkinRecords.id, record.id))
  return getToday(childId)
}

export async function makeup(childId: number, calendarDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate) || calendarDate >= todayLocal()) throwError('CHECKIN_004')
  const used = await countMakeupsThisMonth(childId, calendarDate.slice(0, 7))
  if (used >= 3) throwError('CHECKIN_002')

  await db.transaction(async (tx) => {
    await tx
      .insert(checkinRecords)
      .values({
        childId,
        checkinDate: calendarDate,
        taskGarden: 'auto_done',
        taskEat: 'done',
        taskSleep: 'done',
        taskWater: 'done',
        taskSport: 'done',
        isMakeup: true,
        makeupDate: calendarDate,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [checkinRecords.childId, checkinRecords.checkinDate],
        set: { isMakeup: true },
      })
    await tx
      .insert(checkinCalendar)
      .values({ childId, calendarDate, status: 'makeup' })
      .onConflictDoUpdate({
        target: [checkinCalendar.childId, checkinCalendar.calendarDate],
        set: { status: 'makeup' },
      })
  })

  return getToday(childId)
}

export async function getCalendar(childId: number, month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) throwError('CHECKIN_004')
  const rows = await db
    .select()
    .from(checkinCalendar)
    .where(and(eq(checkinCalendar.childId, childId), sql`to_char(${checkinCalendar.calendarDate}, 'YYYY-MM') = ${month}`))

  const { streak, longestStreak } = await computeStreaks(childId)
  const days = rows.map((r) => ({
    date: r.calendarDate,
    status: r.status,
    is_makeup: r.status === 'makeup',
    sub_items_completed: r.subItemsCompleted,
    garden_icon: r.gardenIcon,
  }))

  return { month, days, streak, longest_streak: longestStreak }
}
