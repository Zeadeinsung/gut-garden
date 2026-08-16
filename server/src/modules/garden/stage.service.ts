import { count, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { gardenActionLogs, checkinCalendar, badgeAwards } from '../../db/schema/index.js'

export interface GardenStats {
  checkinDays: number
  feedCount: number
  badgeCount: number
}

export interface StageInfo {
  growthStage: number
  label: string
  unlocked: string[]
}

export const STAGE_REQS: { stage: number; checkinDays: number; feedCount: number; badgeCount: number; label: string; unlock: string }[] = [
  { stage: 1, checkinDays: 0, feedCount: 0, badgeCount: 0, label: '种子', unlock: '' },
  { stage: 2, checkinDays: 3, feedCount: 10, badgeCount: 0, label: '幼苗', unlock: '角色动画' },
  { stage: 3, checkinDays: 7, feedCount: 30, badgeCount: 0, label: '成长', unlock: '放大镜' },
  { stage: 4, checkinDays: 21, feedCount: 100, badgeCount: 3, label: '丰收', unlock: '花园状态切换' },
  { stage: 5, checkinDays: 50, feedCount: 200, badgeCount: 6, label: '大师', unlock: '全角色 + 全部知识模块' },
  { stage: 6, checkinDays: 100, feedCount: 500, badgeCount: 10, label: '终极', unlock: '花园完全体（金边特效）' },
]

export async function collectStats(childId: number): Promise<GardenStats> {
  const [cal] = await db
    .select({ value: count() })
    .from(checkinCalendar)
    .where(eq(checkinCalendar.childId, childId))
  const [feed] = await db
    .select({ value: count() })
    .from(gardenActionLogs)
    .where(eq(gardenActionLogs.childId, childId))
  const [badge] = await db
    .select({ value: count() })
    .from(badgeAwards)
    .where(eq(badgeAwards.childId, childId))

  return {
    checkinDays: Number(cal?.value) || 0,
    feedCount: Number(feed?.value) || 0,
    badgeCount: Number(badge?.value) || 0,
  }
}

export function evaluateStage(stats: GardenStats): StageInfo {
  let stage = 1
  for (const req of STAGE_REQS) {
    if (stats.checkinDays >= req.checkinDays && stats.feedCount >= req.feedCount && stats.badgeCount >= req.badgeCount) {
      stage = req.stage
    } else {
      break
    }
  }
  const unlocked = STAGE_REQS.filter((r) => r.stage <= stage).map((r) => r.unlock).filter(Boolean)
  return { growthStage: stage, label: STAGE_REQS[stage - 1].label, unlocked }
}
