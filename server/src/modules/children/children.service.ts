import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { children, gardenStates } from '../../db/schema/index.js'
import { toChildProfile, type ChildProfile } from '../../lib/mappers.js'
import { throwError } from '../../config/errors.js'

export interface CreateChildInput {
  nickname: string
  age: number
  avatar_url?: string | null
}

function assertAge(age: number): void {
  if (!Number.isInteger(age) || age < 3 || age > 10) throwError('CHILD_002')
}

export async function listChildren(parentId: number): Promise<ChildProfile[]> {
  const rows = await db.select().from(children).where(eq(children.parentId, parentId)).orderBy(children.createdAt)
  return rows.map(toChildProfile)
}

export async function createChild(parentId: number, input: CreateChildInput): Promise<ChildProfile> {
  assertAge(input.age)

  const [child] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(children)
      .values({
        parentId,
        nickname: input.nickname,
        age: input.age,
        avatarUrl: input.avatar_url ?? null,
        dailyLimitMinutes: 30,
      })
      .returning()

    await tx
      .insert(gardenStates)
      .values({
        childId: created.id,
        currentState: 'healthy',
        moistureLevel: 50,
        growthStage: 1,
        gardenXp: 0,
        unlockedFeatures: [],
      })
      .onConflictDoNothing()

    return [created]
  })

  return toChildProfile(child)
}

export async function updateChild(parentId: number, childId: number, input: Partial<CreateChildInput>): Promise<ChildProfile> {
  const existing = (await db.select().from(children).where(and(eq(children.id, childId), eq(children.parentId, parentId))))[0]
  if (!existing) throwError('CHILD_001')

  if (input.age !== undefined) assertAge(input.age)

  const [updated] = await db
    .update(children)
    .set({
      nickname: input.nickname ?? existing.nickname,
      age: input.age ?? existing.age,
      avatarUrl: input.avatar_url !== undefined ? (input.avatar_url ?? null) : existing.avatarUrl,
    })
    .where(eq(children.id, childId))
    .returning()

  return toChildProfile(updated)
}

export async function deleteChild(parentId: number, childId: number): Promise<void> {
  const existing = (await db.select().from(children).where(and(eq(children.id, childId), eq(children.parentId, parentId))))[0]
  if (!existing) throwError('CHILD_001')

  await db.delete(children).where(eq(children.id, childId))
}
