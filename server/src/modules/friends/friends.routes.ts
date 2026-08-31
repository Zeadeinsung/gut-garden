import type { FastifyInstance } from 'fastify'
import { requireParentId } from '../auth/auth.routes.js'
import { listFriends, addFriendship } from './friends.service.js'
import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { children } from '../../db/schema/index.js'
import { throwError } from '../../config/errors.js'

export default async function friendsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/friends', async (req) => {
    const pid = requireParentId(req)
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)

    if (childId) {
      const owned = await db.select({ id: children.id }).from(children).where(eq(children.id, childId))
      if (!owned.length || Number(owned[0].id) !== childId) {
        // 好友接口仅允许查询自己的档案；非本人 child 直接返回空
        return { code: 0, data: [] }
      }
    } else {
      const mine = await db.select({ id: children.id }).from(children).where(eq(children.parentId, pid)).orderBy(children.createdAt)
      if (!mine.length) return { code: 0, data: [] }
      return { code: 0, data: await listFriends(Number(mine[0].id)) }
    }

    return { code: 0, data: await listFriends(childId) }
  })

  fastify.post('/api/friends', async (req) => {
    requireParentId(req)
    const body = req.body as { child_id?: number; friend_child_id?: number }
    if (!body.child_id || !body.friend_child_id) throwError('FRIENDS_001')
    await addFriendship(Number(body.child_id), Number(body.friend_child_id))
    return { code: 0, data: { added: true } }
  })
}
