import { and, eq, gte, lte, inArray, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import {
  checkinCalendar,
  gardenStates,
  gardenActionLogs,
  badgeAwards,
  stoolAnalyses,
  quizRecords,
  knowledgeModuleProgress,
  checkinRecords,
} from '../../db/schema/index.js'
import { throwError } from '../../config/errors'

const SUB_COLUMNS = ['subWater', 'subVegetable', 'subFruit', 'subOutdoor', 'subEarlySleep'] as const
const STAGE_LABELS = ['', '种子', '幼苗', '成长', '丰收', '大师', '终极']

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return fmtDate(d)
}

export function weekRange(dateStr?: string): { start: string; end: string } {
  const ref = dateStr ? new Date(dateStr) : new Date()
  const day = ref.getDay() || 7
  const monday = new Date(ref)
  monday.setDate(ref.getDate() - day + 1)
  const start = fmtDate(monday)
  return { start, end: addDays(start, 6) }
}

export function monthRange(month?: string): { start: string; end: string } {
  const ref = month ? new Date(`${month}-01T00:00:00`) : new Date()
  const start = fmtDate(new Date(ref.getFullYear(), ref.getMonth(), 1))
  const end = fmtDate(new Date(ref.getFullYear(), ref.getMonth() + 1, 0))
  return { start, end }
}

function longestRun(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0
  let longest = 1
  let run = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1])
    const cur = new Date(sortedDates[i])
    prev.setDate(prev.getDate() + 1)
    run = prev.getTime() === cur.getTime() ? run + 1 : 1
    if (run > longest) longest = run
  }
  return longest
}

function daysInPeriod(start: string, end: string): number {
  const a = new Date(start)
  const b = new Date(end)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1
}

export async function generateReport(childId: number, periodType: 'week' | 'month' | 'day', range: { start: string; end: string }) {
  if (!childId) throwError('CHILD_001')
  const { start, end } = range

  const calRows = await db
    .select({ calendarDate: checkinCalendar.calendarDate })
    .from(checkinCalendar)
    .where(
      and(
        eq(checkinCalendar.childId, childId),
        inArray(checkinCalendar.status, ['done', 'makeup']),
        gte(checkinCalendar.calendarDate, start),
        lte(checkinCalendar.calendarDate, end)
      )
    )
  const checkinDays = calRows.length
  const checkinRate = Math.round((checkinDays / daysInPeriod(start, end)) * 100)

  const allCal = await db
    .select({ calendarDate: checkinCalendar.calendarDate })
    .from(checkinCalendar)
    .where(and(eq(checkinCalendar.childId, childId), inArray(checkinCalendar.status, ['done', 'makeup']), lte(checkinCalendar.calendarDate, end)))
  const maxStreak = longestRun(allCal.map((r) => r.calendarDate).sort())

  const [garden] = await db.select().from(gardenStates).where(eq(gardenStates.childId, childId))
  const growthStage = garden?.growthStage ?? 0
  const stageLabel = STAGE_LABELS[growthStage] ?? ''

  const badges = await db.select({ rarity: badgeAwards.rarity }).from(badgeAwards).where(eq(badgeAwards.childId, childId))
  const badgeDist = { total: badges.length, bronze: 0, silver: 0, gold: 0 }
  for (const b of badges) badgeDist[b.rarity as 'bronze'] += 1

  const stools = await db
    .select({ bristolType: stoolAnalyses.bristolType, uploadedAt: stoolAnalyses.uploadedAt })
    .from(stoolAnalyses)
    .where(and(eq(stoolAnalyses.childId, childId), sql`date(${stoolAnalyses.uploadedAt}) between ${start} and ${end}`))
  const bristolDist: { bristol: number; count: number }[] = []
  const bristolMap = new Map<number, number>()
  for (const s of stools) {
    if (!s.bristolType) continue
    bristolMap.set(s.bristolType, (bristolMap.get(s.bristolType) ?? 0) + 1)
  }
  for (const [bristol, count] of Array.from(bristolMap.entries()).sort((a, b2) => a[0] - b2[0])) {
    bristolDist.push({ bristol, count })
  }

  const feeds = await db
    .select({ id: gardenActionLogs.id })
    .from(gardenActionLogs)
    .where(and(eq(gardenActionLogs.childId, childId), eq(gardenActionLogs.actionType, 'feed'), sql`date(${gardenActionLogs.createdAt}) between ${start} and ${end}`))
  const feedCount = feeds.length

  const quizzes = await db
    .select({ answerCorrect: quizRecords.answerCorrect, quizDate: quizRecords.quizDate })
    .from(quizRecords)
    .where(and(eq(quizRecords.childId, childId), gte(quizRecords.quizDate, start), lte(quizRecords.quizDate, end)))
  const quizAccuracy = quizzes.length ? Math.round((quizzes.filter((q) => q.answerCorrect).length / quizzes.length) * 100) : 0

  const mods = await db.select({ completedAt: knowledgeModuleProgress.completedAt }).from(knowledgeModuleProgress).where(eq(knowledgeModuleProgress.childId, childId))
  const modulesCompleted = mods.filter((m) => m.completedAt).length

  const subRecords = await db
    .select()
    .from(checkinRecords)
    .where(and(eq(checkinRecords.childId, childId), gte(checkinRecords.checkinDate, start), lte(checkinRecords.checkinDate, end)))
  let subDone = 0
  let subTotal = 0
  for (const r of subRecords) {
    for (const col of SUB_COLUMNS) {
      subTotal += 1
      if (r[col]) subDone += 1
    }
  }
  const subItemRate = subTotal ? Math.round((subDone / subTotal) * 100) : 0

  const activeDays = new Set<string>([
    ...calRows.map((r) => r.calendarDate),
    ...stools.map((s) => s.uploadedAt.toISOString().slice(0, 10)),
    ...quizzes.map((q) => String(q.quizDate)),
    ...subRecords.map((r) => r.checkinDate),
  ]).size

  // 花园状态分布：以周期内行为推断（健康食物→healthy / 高糖→high_sugar / 浇水→dry 恢复中）
  const actions = await db
    .select({ actionType: gardenActionLogs.actionType, actionDetail: gardenActionLogs.actionDetail })
    .from(gardenActionLogs)
    .where(
      and(
        eq(gardenActionLogs.childId, childId),
        inArray(gardenActionLogs.actionType, ['feed', 'treatment']),
        sql`date(${gardenActionLogs.createdAt}) between ${start} and ${end}`
      )
    )
  const stateCounts: Record<string, number> = { healthy: 0, high_sugar: 0, dry: 0 }
  for (const a of actions) {
    if (a.actionType === 'feed') {
      const food = String((a.actionDetail as { food_type?: string } | null)?.food_type ?? '')
      if (food === 'candy' || food === 'cake') stateCounts.high_sugar += 1
      else stateCounts.healthy += 1
    } else if (a.actionType === 'treatment') {
      stateCounts.dry += 1
    }
  }
  const gardenStateDist = Object.entries(stateCounts).map(([state, count]) => ({ state, count }))

  return {
    period: { start, end, type: periodType },
    checkin_rate: checkinRate,
    max_streak: maxStreak,
    growth_stage: growthStage,
    stage_label: stageLabel,
    badges: badgeDist,
    stool_count: stools.length,
    bristol_distribution: bristolDist,
    feed_count: feedCount,
    quiz_accuracy: quizAccuracy,
    modules_completed: modulesCompleted,
    sub_item_rate: subItemRate,
    active_days: activeDays,
    garden_state_distribution: gardenStateDist,
  }
}
