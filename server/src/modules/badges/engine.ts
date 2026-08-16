import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { badgeDefs, badgeAwards, checkinCalendar, gardenActionLogs, quizRecords, stoolAnalyses, knowledgeModuleProgress, checkinRecords, children } from '../../db/schema/index.js'
import { addGardenXp, todayLocal } from '../garden/garden.service.js'
import { throwError } from '../../config/errors'

const RARITY_XP = { bronze: 20, silver: 50, gold: 100 } as const
type Rarity = keyof typeof RARITY_XP

// 节日映射（春节等按农历近似日期，MVP 用静态配置）
const HOLIDAYS: Record<string, string[]> = {
  spring_festival: ['2026-02-17', '2026-02-18', '2026-02-19', '2027-02-06', '2027-02-07', '2027-02-08'],
}

export interface BadgeStats {
  checkinStreakMax: number
  checkinTotal: number
  feedTotal: number
  magnifierTotal: number
  treatmentTotal: number
  quizCorrectTotal: number
  stoolTotal: number
  stoolStreakMax: number
  type4StreakMax: number
  perfectWeekCount: number
  allSubItemsStreakMax: number
  completedModules: string[]
  isBirthday: boolean
  holiday: string | null
}

function fmtLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

function weekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay() || 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  return fmtLocalDate(monday)
}

export async function collectStats(childId: number): Promise<BadgeStats> {
  const calDates = (
    await db
      .select({ calendarDate: checkinCalendar.calendarDate })
      .from(checkinCalendar)
      .where(and(eq(checkinCalendar.childId, childId), inArray(checkinCalendar.status, ['done', 'makeup'])))
      .orderBy(checkinCalendar.calendarDate)
  ).map((r) => r.calendarDate)

  const actions = await db.select({ actionType: gardenActionLogs.actionType }).from(gardenActionLogs).where(eq(gardenActionLogs.childId, childId))
  const feedTotal = actions.filter((a) => a.actionType === 'feed').length
  const magnifierTotal = actions.filter((a) => a.actionType === 'magnifier').length
  const treatmentTotal = actions.filter((a) => a.actionType === 'treatment').length

  const quizCorrect = (
    await db
      .select({ id: quizRecords.id })
      .from(quizRecords)
      .where(and(eq(quizRecords.childId, childId), eq(quizRecords.answerCorrect, true)))
  ).length

  const stools = await db
    .select({ bristolType: stoolAnalyses.bristolType, uploadedAt: stoolAnalyses.uploadedAt })
    .from(stoolAnalyses)
    .where(eq(stoolAnalyses.childId, childId))
    .orderBy(stoolAnalyses.uploadedAt)
  const stoolDates = Array.from(new Set(stools.map((s) => fmtLocalDate(s.uploadedAt))))
  const type4Dates = Array.from(new Set(stools.filter((s) => s.bristolType === 4).map((s) => fmtLocalDate(s.uploadedAt)))).sort()

  const subRecords = await db
    .select({
      checkinDate: checkinRecords.checkinDate,
      subWater: checkinRecords.subWater,
      subVegetable: checkinRecords.subVegetable,
      subFruit: checkinRecords.subFruit,
      subOutdoor: checkinRecords.subOutdoor,
      subEarlySleep: checkinRecords.subEarlySleep,
    })
    .from(checkinRecords)
    .where(eq(checkinRecords.childId, childId))
    .orderBy(checkinRecords.checkinDate)
  const allSubDates = subRecords
    .filter((r) => r.subWater && r.subVegetable && r.subFruit && r.subOutdoor && r.subEarlySleep)
    .map((r) => r.checkinDate)

  const mods = await db
    .select({ moduleCode: knowledgeModuleProgress.moduleCode, completedAt: knowledgeModuleProgress.completedAt })
    .from(knowledgeModuleProgress)
    .where(eq(knowledgeModuleProgress.childId, childId))
  const completedModuleList = mods.filter((m) => m.completedAt).map((m) => m.moduleCode)

  // 完美周：任一有数据的周内 7 天全部 done/makeup
  const daysByWeek = new Map<string, number>()
  for (const d of calDates) {
    const wk = weekKey(d)
    daysByWeek.set(wk, (daysByWeek.get(wk) ?? 0) + 1)
  }
  const perfectWeekCount = Array.from(daysByWeek.values()).filter((n) => n >= 7).length

  // 生日：children 表无生日字段，暂不触发
  const childRow = (await db.select().from(children).where(eq(children.id, childId)))[0]
  const today = todayLocal()
  let isBirthday = false
  if (childRow?.createdAt) {
    const created = fmtLocalDate(childRow.createdAt)
    isBirthday = created.slice(5) === today.slice(5)
  }

  let holiday: string | null = null
  for (const [key, dates] of Object.entries(HOLIDAYS)) {
    if (dates.includes(today)) holiday = key
  }

  return {
    checkinStreakMax: longestRun([...calDates].sort()),
    checkinTotal: calDates.length,
    feedTotal,
    magnifierTotal,
    treatmentTotal,
    quizCorrectTotal: quizCorrect,
    stoolTotal: stools.length,
    stoolStreakMax: longestRun(stoolDates.sort()),
    type4StreakMax: longestRun(type4Dates),
    perfectWeekCount,
    allSubItemsStreakMax: longestRun(allSubDates),
    completedModules: completedModuleList,
    isBirthday,
    holiday,
  }
}

type Rule = Record<string, unknown> | null

function checkRule(rule: Rule, stats: BadgeStats): boolean {
  if (!rule) return false
  const threshold = Number(rule.threshold ?? 0)
  switch (rule.type) {
    case 'checkin_streak':
      return stats.checkinStreakMax >= threshold
    case 'checkin_total':
      return stats.checkinTotal >= threshold
    case 'feed_total':
      return stats.feedTotal >= threshold
    case 'magnifier_use':
      return stats.magnifierTotal >= threshold
    case 'treatment_total':
      return stats.treatmentTotal >= threshold
    case 'quiz_correct':
      return stats.quizCorrectTotal >= threshold
    case 'stool_first':
      return stats.stoolTotal >= 1
    case 'stool_streak':
      return stats.stoolStreakMax >= threshold
    case 'bristol_type4_streak':
      return stats.type4StreakMax >= threshold
    case 'perfect_week':
      return rule.weeks ? stats.perfectWeekCount >= Number(rule.weeks) : stats.perfectWeekCount >= 1
    case 'all_sub_items':
      return stats.allSubItemsStreakMax >= threshold
    case 'module_completed':
      if (rule.module_code === 'all') return stats.completedModules.length >= 5
      return stats.completedModules.includes(String(rule.module_code))
    case 'birthday':
      return stats.isBirthday
    case 'holiday':
      return Boolean(stats.holiday) && (!rule.holiday || stats.holiday === rule.holiday)
    default:
      return false
  }
}

export interface AwardEvent {
  defCode: string
  rarity: Rarity
  name: string
  xp: number
}

/**
 * 事件驱动评估：加载全部启用徽章，按 铜→银→金 依次授予/升级。
 * 幂等：event_id = `badge:{child}:{code}:{rarity}`，靠唯一索引防重，冲突不重复发奖。
 */
export async function evaluate(childId: number, statsOverride?: BadgeStats): Promise<AwardEvent[]> {
  const stats = statsOverride ?? (await collectStats(childId))
  const defs = await db.select().from(badgeDefs).where(eq(badgeDefs.isActive, true))
  const awarded: AwardEvent[] = []

  for (const def of defs) {
    const tiers: { rarity: Rarity; rule: Rule }[] = [
      { rarity: 'bronze', rule: def.conditionRule as Rule },
      { rarity: 'silver', rule: (def.silverRule as Rule) ?? null },
      { rarity: 'gold', rule: (def.goldRule as Rule) ?? null },
    ]
    for (const tier of tiers) {
      if (!checkRule(tier.rule, stats)) continue
      const eventId = `badge:${childId}:${def.code}:${tier.rarity}`
      const [inserted] = await db
        .insert(badgeAwards)
        .values({
          childId,
          badgeDefId: def.id,
          rarity: tier.rarity,
          eventId,
          awardedAt: new Date(),
          upgradedAt: tier.rarity === 'bronze' ? null : new Date(),
        })
        .onConflictDoNothing()
        .returning()
      if (inserted) {
        const xp = RARITY_XP[tier.rarity]
        await addGardenXp(childId, xp)
        awarded.push({ defCode: def.code, rarity: tier.rarity, name: def.name, xp })
      }
    }
  }

  return awarded
}

export async function awardedBadges(childId: number) {
  const rows = await db
    .select({
      awardId: badgeAwards.id,
      rarity: badgeAwards.rarity,
      awardedAt: badgeAwards.awardedAt,
      upgradedAt: badgeAwards.upgradedAt,
      code: badgeDefs.code,
      name: badgeDefs.name,
      category: badgeDefs.category,
      description: badgeDefs.description,
    })
    .from(badgeAwards)
    .innerJoin(badgeDefs, eq(badgeAwards.badgeDefId, badgeDefs.id))
    .where(eq(badgeAwards.childId, childId))
    .orderBy(badgeAwards.awardedAt)

  return rows.map((r) => ({
    id: r.awardId,
    code: r.code,
    name: r.name,
    category: r.category,
    description: r.description,
    rarity: r.rarity,
    awarded_at: r.awardedAt,
    upgraded_at: r.upgradedAt,
  }))
}

function ruleProgress(rule: Rule, stats: BadgeStats): { current: number; target: number } {
  if (!rule) return { current: 0, target: 1 }
  const threshold = Number(rule.threshold ?? 1)
  switch (rule.type) {
    case 'checkin_streak':
      return { current: stats.checkinStreakMax, target: threshold }
    case 'checkin_total':
      return { current: stats.checkinTotal, target: threshold }
    case 'feed_total':
      return { current: stats.feedTotal, target: threshold }
    case 'magnifier_use':
      return { current: stats.magnifierTotal, target: threshold }
    case 'treatment_total':
      return { current: stats.treatmentTotal, target: threshold }
    case 'quiz_correct':
      return { current: stats.quizCorrectTotal, target: threshold }
    case 'stool_first':
      return { current: Math.min(stats.stoolTotal, 1), target: 1 }
    case 'stool_streak':
      return { current: stats.stoolStreakMax, target: threshold }
    case 'bristol_type4_streak':
      return { current: stats.type4StreakMax, target: threshold }
    case 'perfect_week':
      return { current: stats.perfectWeekCount, target: Number(rule.weeks ?? 1) }
    case 'all_sub_items':
      return { current: stats.allSubItemsStreakMax, target: threshold }
    case 'module_completed': {
      const total = rule.module_code === 'all' ? 5 : 1
      const done = rule.module_code === 'all' ? stats.completedModules.length : stats.completedModules.includes(String(rule.module_code)) ? 1 : 0
      return { current: done, target: total }
    }
    case 'birthday':
      return { current: stats.isBirthday ? 1 : 0, target: 1 }
    case 'holiday':
      return { current: stats.holiday ? 1 : 0, target: 1 }
    default:
      return { current: 0, target: 1 }
  }
}

export async function pendingBadges(childId: number) {
  const stats = await collectStats(childId)
  const defs = await db.select().from(badgeDefs).where(eq(badgeDefs.isActive, true)).orderBy(badgeDefs.sortOrder)
  const awards = await db.select().from(badgeAwards).where(eq(badgeAwards.childId, childId))

  const has = (defId: number, rarity: Rarity) => awards.some((a) => a.badgeDefId === defId && a.rarity === rarity)
  const result: Record<string, unknown>[] = []

  for (const def of defs) {
    const tiers: { rarity: Rarity; rule: Rule }[] = [
      { rarity: 'bronze', rule: def.conditionRule as Rule },
      { rarity: 'silver', rule: (def.silverRule as Rule) ?? null },
      { rarity: 'gold', rule: (def.goldRule as Rule) ?? null },
    ]
    let nextTier: { rarity: Rarity; rule: Rule } | null = null
    for (const t of tiers) {
      if (!t.rule) continue
      if (!has(def.id, t.rarity)) {
        nextTier = t
        break
      }
    }
    if (!nextTier) continue
    const { current, target } = ruleProgress(nextTier.rule, stats)
    result.push({
      badge_def_id: def.id,
      code: def.code,
      name: def.name,
      category: def.category,
      description: def.description,
      next_rarity: nextTier.rarity,
      current_progress: current,
      target,
      progress_percent: Math.min(100, Math.round((current / Math.max(target, 1)) * 100)),
    })
  }

  return result
}

export async function listBadgeDefs() {
  const rows = await db.select().from(badgeDefs).where(eq(badgeDefs.isActive, true)).orderBy(badgeDefs.sortOrder)
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    category: r.category,
    description: r.description,
    condition_rule: r.conditionRule,
    silver_rule: r.silverRule,
    gold_rule: r.goldRule,
    sort_order: r.sortOrder,
  }))
}

export async function getBadgeDef(code: string) {
  const row = (await db.select().from(badgeDefs).where(eq(badgeDefs.code, code)))[0]
  if (!row) throwError('BADGE_001')
  return row
}
