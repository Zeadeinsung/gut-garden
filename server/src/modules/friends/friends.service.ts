import { and, eq, ne, inArray, count } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { friendships, children, checkinCalendar, gardenActionLogs, badgeAwards, gardenStates } from '../../db/schema/index.js'
import { evaluateStage } from '../garden/stage.service.js'
import { throwError } from '../../config/errors.js'

const EMOJIS = ['🐰', '🐼', '🐨', '🦊', '🐸', '🐥', '🦄', '🐯', '🐙', '🐝', '🐳', '🦔', '🐿️', '🐢']
const COLORS = ['#F6C8CB', '#BCE3C7', '#FFE3AE', '#C7D8F5', '#E3C7F5', '#F5D7C7', '#C7F0E8', '#F0E0C7', '#D9F5C7', '#F5C7E0', '#C7DDF5', '#E8F5C7']

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length]
}

export interface FriendProfile {
  id: number
  name: string
  age: number
  avatar_url: string | null
  emoji: string
  color: string
  level: number
  stage_label: string
  xp: number
  badge_count: number
  checkin_days: number
  energy: number
  status: string
}

export async function listFriends(childId: number): Promise<FriendProfile[]> {
  if (!childId) throwError('CHILD_001')

  // 所有用户互为好友：好友列表 = 除自己外的全部孩子（演示期社交简化，不依赖好友关系表）
  const kids = await db.select().from(children).where(ne(children.id, childId))
  if (!kids.length) return []
  const ids = kids.map((k) => Number(k.id))

  const [calCounts, feedCounts, badgeCounts, states] = await Promise.all([
    db.select({ childId: checkinCalendar.childId, value: count() }).from(checkinCalendar).where(inArray(checkinCalendar.childId, ids)).groupBy(checkinCalendar.childId),
    db.select({ childId: gardenActionLogs.childId, value: count() }).from(gardenActionLogs).where(inArray(gardenActionLogs.childId, ids)).groupBy(gardenActionLogs.childId),
    db.select({ childId: badgeAwards.childId, value: count() }).from(badgeAwards).where(inArray(badgeAwards.childId, ids)).groupBy(badgeAwards.childId),
    db.select().from(gardenStates).where(inArray(gardenStates.childId, ids)),
  ])

  const calMap = new Map(calCounts.map((r) => [Number(r.childId), Number(r.value)]))
  const feedMap = new Map(feedCounts.map((r) => [Number(r.childId), Number(r.value)]))
  const badgeMap = new Map(badgeCounts.map((r) => [Number(r.childId), Number(r.value)]))
  const stateMap = new Map(states.map((s) => [Number(s.childId), s]))

  return kids
    .sort((a, b) => a.id - b.id)
    .map((kid) => {
      const id = Number(kid.id)
      const checkinDays = calMap.get(id) ?? 0
      const feedCount = feedMap.get(id) ?? 0
      const badgeCount = badgeMap.get(id) ?? 0
      const state = stateMap.get(id)
      const stage = evaluateStage({ checkinDays, feedCount, badgeCount })

      let status = '正在探索新知识'
      if (checkinDays >= 3 && checkinDays < 10) status = `连续打卡 ${checkinDays} 天`
      else if (checkinDays >= 10) status = `已坚持 ${checkinDays} 天，太棒了！`
      if (badgeCount === 0 && checkinDays === 0) status = '刚加入，一起玩吧！'

      return {
        id,
        name: kid.nickname,
        age: kid.age,
        avatar_url: kid.avatarUrl,
        emoji: pick(EMOJIS, id),
        color: pick(COLORS, id),
        level: stage.growthStage,
        stage_label: stage.label,
        xp: state?.gardenXp ?? 0,
        badge_count: badgeCount,
        checkin_days: checkinDays,
        energy: state?.moistureLevel ?? 50,
        status,
      }
    })
}

export async function addFriendship(childId: number, friendChildId: number): Promise<boolean> {
  if (!childId || !friendChildId || childId === friendChildId) throwError('FRIENDS_001')
  await db
    .insert(friendships)
    .values({ childId, friendChildId })
    .onConflictDoNothing()
  await db
    .insert(friendships)
    .values({ childId: friendChildId, friendChildId: childId })
    .onConflictDoNothing()
  return true
}
