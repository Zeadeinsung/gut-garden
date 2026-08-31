import { eq, and, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { gardenStates, gardenActionLogs, children } from '../../db/schema/index.js'
import { collectStats, evaluateStage } from './stage.service.js'
import { throwError } from '../../config/errors.js'

const HEALTHY_FOODS = new Set(['broccoli', 'carrot', 'yogurt', 'apple', 'corn'])
const HIGH_SUGAR_FOODS = new Set(['candy', 'cake'])

const FEED_XP = 2
const FEED_MOISTURE_UP = 10
const HIGH_SUGAR_MOISTURE_DOWN = 8
const WATER_MOISTURE_UP = 15

export type ActionType = 'feed' | 'explore' | 'magnifier' | 'treatment'

export interface LogActionInput {
  childId: number
  actionType: ActionType
  actionDetail?: Record<string, unknown> | null
}

function fmtLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayLocal(): string {
  return fmtLocalDate(new Date())
}

async function computeAndSyncStage(childId: number, currentStage: number): Promise<ReturnType<typeof evaluateStage>> {
  const stats = await collectStats(childId)
  const stage = evaluateStage(stats)
  if (stage.growthStage !== currentStage) {
    await db
      .update(gardenStates)
      .set({ growthStage: stage.growthStage, lastUpdated: new Date() })
      .where(eq(gardenStates.childId, childId))
  }
  return stage
}

/** 子账号缺花园状态时自动补建默认行，避免旧数据/迁移导致 GARDEN_001 */
export async function ensureGardenState(childId: number): Promise<void> {
  await db
    .insert(gardenStates)
    .values({
      childId,
      currentState: 'healthy',
      moistureLevel: 50,
      growthStage: 1,
      gardenXp: 0,
      unlockedFeatures: [],
    })
    .onConflictDoNothing()
}

export async function getGardenState(childId: number) {
  await ensureChildExists(childId)
  await ensureGardenState(childId)
  const row = (await db.select().from(gardenStates).where(eq(gardenStates.childId, childId)))[0]
  if (!row) throwError('GARDEN_001')

  const interactionCount = await todayInteractionCount(childId)
  const stage = await computeAndSyncStage(childId, row.growthStage)
  const storedUnlocked = (row.unlockedFeatures as string[]) || []
  const unlocked = Array.from(new Set([...storedUnlocked, ...stage.unlocked]))

  return {
    child_id: childId,
    current_state: row.currentState,
    moisture_level: row.moistureLevel,
    growth_stage: stage.growthStage,
    garden_xp: row.gardenXp,
    interaction_count: interactionCount,
    unlocked_features: unlocked,
    stage_label: stage.label,
  }
}

export async function todayInteractionCount(childId: number): Promise<number> {
  const rows = await db
    .select({ id: gardenActionLogs.id })
    .from(gardenActionLogs)
    .where(and(eq(gardenActionLogs.childId, childId), sql`date(${gardenActionLogs.createdAt}) = ${todayLocal()}`))

  return rows.length
}

function applyFoodEffect(state: string, moisture: number, foodType: string): { currentState: string; moistureLevel: number } {
  let nextState = state
  let nextMoisture = moisture

  if (HIGH_SUGAR_FOODS.has(foodType)) {
    nextMoisture = Math.max(0, moisture - HIGH_SUGAR_MOISTURE_DOWN)
    nextState = 'high_sugar'
  } else if (HEALTHY_FOODS.has(foodType)) {
    nextMoisture = Math.min(100, moisture + FEED_MOISTURE_UP)
    if (state === 'high_sugar' || state === 'dry') nextState = 'recovering'
    else nextState = 'healthy'
    if (nextState === 'recovering' && nextMoisture >= 60) nextState = 'healthy'
  }

  return { currentState: nextState, moistureLevel: nextMoisture }
}

export async function logAction(input: LogActionInput) {
  await ensureGardenState(input.childId)
  const existing = (await db.select().from(gardenStates).where(eq(gardenStates.childId, input.childId)))[0]
  if (!existing) throwError('GARDEN_001')

  const { actionType, actionDetail } = input
  let currentState = existing.currentState
  let moistureLevel = existing.moistureLevel
  let xpGain = 0

  if (actionType === 'feed') {
    const foodType = String(actionDetail?.food_type || '')
    const effect = applyFoodEffect(currentState, moistureLevel, foodType)
    currentState = effect.currentState
    moistureLevel = effect.moistureLevel
    xpGain = FEED_XP
  } else if (actionType === 'treatment') {
    const treatment = String(actionDetail?.treatment || '')
    if (treatment === 'water') {
      moistureLevel = Math.min(100, moistureLevel + WATER_MOISTURE_UP)
      currentState = currentState === 'dry' || currentState === 'high_sugar' ? 'recovering' : currentState
      if (moistureLevel >= 60) currentState = 'healthy'
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(gardenStates)
      .set({ currentState, moistureLevel, gardenXp: existing.gardenXp + xpGain, lastUpdated: new Date() })
      .where(eq(gardenStates.childId, input.childId))

    await tx.insert(gardenActionLogs).values({
      childId: input.childId,
      actionType,
      actionDetail: actionDetail ?? null,
    })
  })

  const interactionCount = await todayInteractionCount(input.childId)
  const stage = await computeAndSyncStage(input.childId, existing.growthStage)

  return {
    child_id: input.childId,
    current_state: currentState,
    moisture_level: moistureLevel,
    growth_stage: stage.growthStage,
    garden_xp: existing.gardenXp + xpGain,
    xp_gained: xpGain,
    interaction_count: interactionCount,
    stage_label: stage.label,
  }
}

export async function ensureChildExists(childId: number): Promise<void> {
  const row = (await db.select().from(children).where(eq(children.id, childId)))[0]
  if (!row) throwError('CHILD_001')
}

export async function addGardenXp(childId: number, amount: number): Promise<number> {
  const [row] = await db
    .update(gardenStates)
    .set({ gardenXp: sql`${gardenStates.gardenXp} + ${amount}`, lastUpdated: new Date() })
    .where(eq(gardenStates.childId, childId))
    .returning({ gardenXp: gardenStates.gardenXp })
  return row?.gardenXp ?? 0
}
