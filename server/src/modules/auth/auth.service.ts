import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { parents, children } from '../../db/schema/index.js'
import { env } from '../../config/env.js'
import { sendLoginCode, verifyLoginCode } from './codeStore.js'
import { toChildProfile, type UserData } from '../../lib/mappers.js'

export { sendLoginCode }

export async function loginWithCode(phone: string, code: string): Promise<{ user: UserData; role: string }> {
  verifyLoginCode(phone, code)

  const role = env.adminPhones.includes(phone) ? 'admin' : 'parent'
  let parent = (await db.select().from(parents).where(eq(parents.phone, phone)))[0]
  if (!parent) {
    const [created] = await db.insert(parents).values({ phone, role }).returning()
    parent = created
  } else {
    await db.update(parents).set({ lastLoginAt: new Date(), role }).where(eq(parents.id, parent.id))
  }

  const user = await getUserData(parent.id, phone)
  return { user, role }
}

export async function getUserData(parentId: number, phone: string): Promise<UserData> {
  const rows = await db
    .select()
    .from(children)
    .where(eq(children.parentId, parentId))
    .orderBy(children.createdAt)

  const list = rows.map(toChildProfile)
  return {
    parent_id: parentId,
    phone,
    children: list,
    active_child_id: list.length ? list[0].id : null,
  }
}

export async function getParentByPhone(phone: string) {
  return (await db.select().from(parents).where(eq(parents.phone, phone)))[0] || null
}
