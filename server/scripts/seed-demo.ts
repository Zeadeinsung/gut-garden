import 'dotenv/config'
import { or, inArray, eq } from 'drizzle-orm'
import { db, pglite, closeDb, isPglite } from '../src/db/index.js'
import {
  parents, children, gardenStates, gardenActionLogs, checkinCalendar, checkinRecords,
  badgeAwards, badgeDefs, knowledgeModuleProgress, quizRecords, stoolAnalyses, friendships,
} from '../src/db/schema/index.js'
import { MODULE_DEFS, MODULE_ORDER } from '../src/modules/classroom/classroom.content.js'

/* ─────────────────────────────────────────────
   演示账号种子脚本
   12 个家长账号（手机号 13800000001~012，每个 1 个孩子）
   3 个空白账号（从零开始）+ 9 个不同进度账号，全部互为好友
   登录方式：/api/auth/send-code 发手机验证码（模拟，打印到服务端控制台）
   ───────────────────────────────────────────── */

interface BadgeSeed { code: string; rarity: 'bronze' | 'silver' | 'gold' }
interface ModuleSeed { code: string; cards: number; quizzes: number; watched: boolean }
interface Account {
  phone: string
  name: string
  age: number
  blank?: boolean
  days?: number
  feeds?: number
  xp?: number
  moisture?: number
  currentState?: string
  badges?: BadgeSeed[]
  modules?: ModuleSeed[]
  stools?: { bristol: number }[]
  quizzes?: number
}

const ACCOUNTS: Account[] = [
  // ── 3 个空白账号（从零开始）──
  { phone: '13800000001', name: '小明', age: 5, blank: true },
  { phone: '13800000002', name: '小红', age: 4, blank: true },
  { phone: '13800000003', name: '小刚', age: 6, blank: true },

  // ── 9 个不同进度账号（从低到高）──
  {
    phone: '13800000004', name: '小美', age: 5,
    days: 5, feeds: 12, xp: 42, moisture: 62, currentState: 'healthy',
    badges: [{ code: 'first_checkin', rarity: 'bronze' }, { code: 'first_feed', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }],
    modules: [{ code: 'fiber_square', cards: 2, quizzes: 1, watched: false }],
    stools: [{ bristol: 4 }, { bristol: 3 }], quizzes: 1,
  },
  {
    phone: '13800000005', name: '小杰', age: 6,
    days: 6, feeds: 22, xp: 70, moisture: 66, currentState: 'healthy',
    badges: [{ code: 'first_checkin', rarity: 'bronze' }, { code: 'first_feed', rarity: 'bronze' }, { code: 'first_stool', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }],
    modules: [{ code: 'fiber_square', cards: 3, quizzes: 2, watched: true }],
    stools: [{ bristol: 4 }, { bristol: 4 }, { bristol: 5 }], quizzes: 2,
  },
  {
    phone: '13800000006', name: '小雨', age: 5,
    days: 10, feeds: 45, xp: 130, moisture: 72, currentState: 'healthy',
    badges: [
      { code: 'first_checkin', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }, { code: 'persist_7d', rarity: 'bronze' },
      { code: 'first_feed', rarity: 'bronze' }, { code: 'first_quiz', rarity: 'bronze' }, { code: 'first_stool', rarity: 'bronze' },
    ],
    modules: [{ code: 'fiber_square', cards: 5, quizzes: 3, watched: true }, { code: 'ferment_workshop', cards: 3, quizzes: 2, watched: false }],
    stools: [{ bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 3 }], quizzes: 4,
  },
  {
    phone: '13800000007', name: '小豆', age: 4,
    days: 15, feeds: 70, xp: 200, moisture: 76, currentState: 'healthy',
    badges: [
      { code: 'first_checkin', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }, { code: 'persist_7d', rarity: 'bronze' },
      { code: 'first_feed', rarity: 'bronze' }, { code: 'feed_50', rarity: 'bronze' }, { code: 'first_magnifier', rarity: 'bronze' },
      { code: 'first_quiz', rarity: 'bronze' }, { code: 'first_stool', rarity: 'bronze' },
    ],
    modules: [{ code: 'fiber_square', cards: 5, quizzes: 3, watched: true }, { code: 'ferment_workshop', cards: 5, quizzes: 3, watched: true }, { code: 'scfa_spring', cards: 2, quizzes: 1, watched: false }],
    stools: [{ bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 3 }], quizzes: 6,
  },
  {
    phone: '13800000008', name: '小阳', age: 6,
    days: 25, feeds: 130, xp: 330, moisture: 79, currentState: 'healthy',
    badges: [
      { code: 'first_checkin', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }, { code: 'persist_7d', rarity: 'bronze' },
      { code: 'first_feed', rarity: 'bronze' }, { code: 'feed_50', rarity: 'bronze' }, { code: 'first_magnifier', rarity: 'bronze' },
      { code: 'magnifier_20', rarity: 'bronze' }, { code: 'first_quiz', rarity: 'bronze' }, { code: 'first_stool', rarity: 'bronze' },
      { code: 'garden_doctor', rarity: 'bronze' },
    ],
    modules: [
      { code: 'fiber_square', cards: 5, quizzes: 3, watched: true }, { code: 'ferment_workshop', cards: 5, quizzes: 3, watched: true },
      { code: 'scfa_spring', cards: 5, quizzes: 3, watched: true }, { code: 'barrier_wall', cards: 3, quizzes: 2, watched: false },
    ],
    stools: [{ bristol: 4 }, { bristol: 4 }, { bristol: 5 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }], quizzes: 8,
  },
  {
    phone: '13800000009', name: '小艾', age: 5,
    days: 35, feeds: 170, xp: 460, moisture: 82, currentState: 'healthy',
    badges: [
      { code: 'first_checkin', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }, { code: 'persist_7d', rarity: 'bronze' },
      { code: 'first_feed', rarity: 'bronze' }, { code: 'feed_50', rarity: 'bronze' }, { code: 'first_magnifier', rarity: 'bronze' },
      { code: 'magnifier_20', rarity: 'bronze' }, { code: 'garden_doctor', rarity: 'bronze' }, { code: 'first_quiz', rarity: 'bronze' },
      { code: 'quiz_10', rarity: 'bronze' }, { code: 'first_stool', rarity: 'bronze' }, { code: 'stool_streak_7', rarity: 'bronze' },
      { code: 'type4_streak_5', rarity: 'bronze' },
    ],
    modules: [
      { code: 'fiber_square', cards: 5, quizzes: 3, watched: true }, { code: 'ferment_workshop', cards: 5, quizzes: 3, watched: true },
      { code: 'scfa_spring', cards: 5, quizzes: 3, watched: true }, { code: 'barrier_wall', cards: 5, quizzes: 3, watched: true },
      { code: 'eco_station', cards: 2, quizzes: 1, watched: false },
    ],
    stools: [{ bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 5 }], quizzes: 12,
  },
  {
    phone: '13800000010', name: '小乐', age: 6,
    days: 55, feeds: 260, xp: 700, moisture: 86, currentState: 'healthy',
    badges: [
      { code: 'first_checkin', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }, { code: 'persist_7d', rarity: 'bronze' }, { code: 'persist_30d', rarity: 'bronze' },
      { code: 'first_feed', rarity: 'bronze' }, { code: 'feed_50', rarity: 'silver' }, { code: 'first_magnifier', rarity: 'bronze' }, { code: 'magnifier_20', rarity: 'bronze' },
      { code: 'garden_doctor', rarity: 'bronze' }, { code: 'first_quiz', rarity: 'bronze' }, { code: 'quiz_10', rarity: 'bronze' }, { code: 'first_stool', rarity: 'bronze' },
      { code: 'stool_streak_7', rarity: 'bronze' }, { code: 'type4_streak_5', rarity: 'bronze' }, { code: 'perfect_week', rarity: 'bronze' },
    ],
    modules: [
      { code: 'fiber_square', cards: 5, quizzes: 3, watched: true }, { code: 'ferment_workshop', cards: 5, quizzes: 3, watched: true },
      { code: 'scfa_spring', cards: 5, quizzes: 3, watched: true }, { code: 'barrier_wall', cards: 5, quizzes: 3, watched: true },
      { code: 'eco_station', cards: 5, quizzes: 3, watched: true },
    ],
    stools: [{ bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 3 }], quizzes: 16,
  },
  {
    phone: '13800000011', name: '小星星', age: 5,
    days: 75, feeds: 360, xp: 950, moisture: 89, currentState: 'healthy',
    badges: [
      { code: 'first_checkin', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }, { code: 'persist_7d', rarity: 'bronze' }, { code: 'persist_30d', rarity: 'silver' },
      { code: 'first_feed', rarity: 'bronze' }, { code: 'feed_50', rarity: 'silver' }, { code: 'first_magnifier', rarity: 'bronze' }, { code: 'magnifier_20', rarity: 'silver' },
      { code: 'garden_doctor', rarity: 'silver' }, { code: 'first_quiz', rarity: 'bronze' }, { code: 'quiz_10', rarity: 'silver' }, { code: 'first_stool', rarity: 'bronze' },
      { code: 'stool_streak_7', rarity: 'silver' }, { code: 'type4_streak_5', rarity: 'silver' }, { code: 'perfect_week', rarity: 'silver' },
    ],
    modules: [
      { code: 'fiber_square', cards: 5, quizzes: 3, watched: true }, { code: 'ferment_workshop', cards: 5, quizzes: 3, watched: true },
      { code: 'scfa_spring', cards: 5, quizzes: 3, watched: true }, { code: 'barrier_wall', cards: 5, quizzes: 3, watched: true },
      { code: 'eco_station', cards: 5, quizzes: 3, watched: true },
    ],
    stools: [{ bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 5 }], quizzes: 20,
  },
  {
    phone: '13800000012', name: '小勇士', age: 6,
    days: 105, feeds: 530, xp: 1350, moisture: 93, currentState: 'healthy',
    badges: [
      { code: 'first_checkin', rarity: 'bronze' }, { code: 'persist_3d', rarity: 'bronze' }, { code: 'persist_7d', rarity: 'gold' }, { code: 'persist_30d', rarity: 'silver' }, { code: 'persist_100d', rarity: 'bronze' },
      { code: 'first_feed', rarity: 'bronze' }, { code: 'feed_50', rarity: 'gold' }, { code: 'first_magnifier', rarity: 'bronze' }, { code: 'magnifier_20', rarity: 'silver' },
      { code: 'garden_doctor', rarity: 'silver' }, { code: 'first_quiz', rarity: 'bronze' }, { code: 'quiz_10', rarity: 'gold' }, { code: 'first_stool', rarity: 'bronze' },
      { code: 'stool_streak_7', rarity: 'gold' }, { code: 'type4_streak_5', rarity: 'silver' }, { code: 'perfect_week', rarity: 'gold' }, { code: 'birthday', rarity: 'bronze' },
    ],
    modules: [
      { code: 'fiber_square', cards: 5, quizzes: 3, watched: true }, { code: 'ferment_workshop', cards: 5, quizzes: 3, watched: true },
      { code: 'scfa_spring', cards: 5, quizzes: 3, watched: true }, { code: 'barrier_wall', cards: 5, quizzes: 3, watched: true },
      { code: 'eco_station', cards: 5, quizzes: 3, watched: true },
    ],
    stools: [
      { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 4 },
      { bristol: 4 }, { bristol: 4 }, { bristol: 4 }, { bristol: 5 },
    ], quizzes: 24,
  },
]

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function ensureFriendshipTable(): Promise<void> {
  if (!isPglite || !pglite) return
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id BIGSERIAL PRIMARY KEY,
      child_id BIGINT NOT NULL,
      friend_child_id BIGINT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uk_friendship_pair ON friendships(child_id, friend_child_id);
    CREATE INDEX IF NOT EXISTS idx_friendship_child ON friendships(child_id);
  `)
}

async function main(): Promise<void> {
  console.log('[seed] ensure friendships table...')
  await ensureFriendshipTable()

  const seedPhones = ACCOUNTS.map((a) => a.phone)

  // ── 清理旧的种子账号 ──
  console.log('[seed] cleaning old demo accounts...')
  const oldParents = await db.select({ id: parents.id }).from(parents).where(inArray(parents.phone, seedPhones))
  const oldParentIds = oldParents.map((p) => Number(p.id))
  let oldChildIds: number[] = []
  if (oldParentIds.length) {
    const kids = await db.select({ id: children.id }).from(children).where(inArray(children.parentId, oldParentIds))
    oldChildIds = kids.map((k) => Number(k.id))
  }
  if (oldChildIds.length) {
    await db.delete(friendships).where(or(inArray(friendships.childId, oldChildIds), inArray(friendships.friendChildId, oldChildIds)))
    const childTables = [gardenStates, gardenActionLogs, checkinCalendar, checkinRecords, badgeAwards, knowledgeModuleProgress, quizRecords, stoolAnalyses] as const
    for (const t of childTables) {
      await db.delete(t).where(inArray(t.childId, oldChildIds))
    }
    await db.delete(children).where(inArray(children.id, oldChildIds))
  }
  if (oldParentIds.length) {
    await db.delete(parents).where(inArray(parents.id, oldParentIds))
  }

  // ── 徽章定义 id 映射 ──
  const defs = await db.select().from(badgeDefs)
  const badgeIdByCode = new Map(defs.map((d) => [d.code, Number(d.id)]))

  const childIds: number[] = []

  for (const acc of ACCOUNTS) {
    const [parent] = await db.insert(parents).values({ phone: acc.phone, role: 'parent', status: 'active' }).returning()
    const pid = Number(parent.id)
    const [child] = await db.insert(children).values({
      parentId: pid,
      nickname: acc.name,
      age: acc.age,
      dailyLimitMinutes: 30,
    }).returning()
    const cid = Number(child.id)
    childIds.push(cid)

    if (acc.blank) {
      console.log(`[seed] blank account ${acc.phone} (${acc.name}) — child ${cid}`)
      await db.insert(gardenStates).values({
        childId: cid,
        currentState: 'healthy',
        moistureLevel: 50,
        growthStage: 1,
        gardenXp: 0,
        unlockedFeatures: [],
      })
      continue
    }

    const days = acc.days ?? 0
    const feeds = acc.feeds ?? 0
    const xp = acc.xp ?? 0
    const moisture = acc.moisture ?? 50

    // 花园状态
    await db.insert(gardenStates).values({
      childId: cid,
      currentState: acc.currentState ?? 'healthy',
      moistureLevel: moisture,
      growthStage: 1,
      gardenXp: xp,
      unlockedFeatures: [],
    })

    // 打卡日历 + 打卡记录（连续 N 天，到今天）
    const start = daysAgo(days - 1)
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const ds = fmtDate(d)
      await db.insert(checkinCalendar).values({ childId: cid, calendarDate: ds, status: 'done', gardenIcon: 'healthy' })
      await db.insert(checkinRecords).values({
        childId: cid,
        checkinDate: ds,
        taskGarden: 'auto_done',
        taskEat: 'done',
        taskSleep: 'done',
        taskWater: 'done',
        taskSport: 'done',
        subWater: true,
        subVegetable: true,
        subFruit: true,
        subOutdoor: true,
        subEarlySleep: true,
        completedAt: new Date(d),
      })
    }

    // 花园喂食日志（feed 数量决定阶段）
    const feedRows = []
    for (let i = 0; i < feeds; i++) {
      feedRows.push({
        childId: cid,
        actionType: 'feed',
        actionDetail: { food_type: 'broccoli' },
        createdAt: new Date(daysAgo(i % Math.max(days, 1))),
      })
    }
    await db.insert(gardenActionLogs).values(feedRows)

    // 徽章
    for (const b of acc.badges ?? []) {
      const defId = badgeIdByCode.get(b.code)
      if (!defId) { console.warn(`[seed] unknown badge code: ${b.code}`); continue }
      await db.insert(badgeAwards).values({ childId: cid, badgeDefId: defId, rarity: b.rarity, awardedAt: new Date(daysAgo(1)) })
    }

    // 课堂模块进度
    for (const m of acc.modules ?? []) {
      const def = MODULE_DEFS[m.code]
      const cardsTotal = def ? def.cards.length : 5
      const cardsUnlocked = Math.min(m.cards, cardsTotal)
      await db.insert(knowledgeModuleProgress).values({
        childId: cid,
        moduleCode: m.code,
        cardsUnlocked,
        cardsTotal,
        quizzesPassed: m.quizzes,
        animationWatched: m.watched,
        completedAt: cardsUnlocked >= cardsTotal ? new Date(daysAgo(1)) : null,
      })
    }

    // 答题记录
    const quizCount = acc.quizzes ?? 0
    const quizRows = []
    for (let i = 0; i < quizCount; i++) {
      quizRows.push({
        childId: cid,
        quizDate: fmtDate(daysAgo(i % Math.max(days, 1))),
        moduleCode: MODULE_ORDER[i % MODULE_ORDER.length],
        questionType: 'single_choice',
        question: `每日一题 ${i + 1}`,
        answerCorrect: true,
      })
    }
    if (quizRows.length) await db.insert(quizRecords).values(quizRows)

    // 便便记录（按天铺开，最近的今天，往前推）
    for (let i = 0; i < (acc.stools ?? []).length; i++) {
      const s = (acc.stools ?? [])[i]
      const uploaded = daysAgo(i)
      const expires = new Date(uploaded)
      expires.setDate(expires.getDate() + 3)
      await db.insert(stoolAnalyses).values({
        childId: cid,
        mode: 'icon_selection',
        imageUrl: '',
        stoolIconType: `type_${s.bristol}`,
        bristolType: s.bristol,
        diagnosis: s.bristol === 4 ? '香蕉便，非常健康' : '基本正常',
        taskSuggestion: null,
        isValid: true,
        uploadedAt: uploaded,
        expiresAt: expires,
      })
    }

    console.log(`[seed] ${acc.phone} (${acc.name}) — child ${cid}, ${days}d/${feeds}f, xp ${xp}, ${acc.badges?.length ?? 0} badges`)
  }

  // ── 互为好友：所有孩子两两互加 ──
  console.log(`[seed] creating friendships among ${childIds.length} children...`)
  const pairRows: { childId: number; friendChildId: number }[] = []
  for (let i = 0; i < childIds.length; i++) {
    for (let j = i + 1; j < childIds.length; j++) {
      pairRows.push({ childId: childIds[i], friendChildId: childIds[j] })
      pairRows.push({ childId: childIds[j], friendChildId: childIds[i] })
    }
  }
  if (pairRows.length) await db.insert(friendships).values(pairRows).onConflictDoNothing()

  console.log(`\n[seed] done! ${childIds.length} children, ${pairRows.length} friendship rows.`)
  console.log('\n登录方式：POST /api/auth/send-code { phone } → 服务端控制台看验证码 → POST /api/auth/verify-code')
  console.log('账号清单：')
  for (const acc of ACCOUNTS) {
    console.log(`  ${acc.phone}  ${acc.name}${acc.blank ? '  (空白)' : `  ${acc.days}天 / ${acc.feeds}次喂食 / xp ${acc.xp}`}`)
  }
}

main()
  .catch((err) => {
    console.error('[seed] FAILED:', err)
    process.exitCode = 1
  })
  .finally(() => closeDb())
