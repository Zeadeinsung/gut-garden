import type { FastifyInstance } from 'fastify'
import { listChildren, createChild, updateChild, deleteChild } from './children.service.js'
import { requireParentId } from '../auth/auth.routes.js'

export default async function childrenRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/children', async (req) => {
    const pid = requireParentId(req)
    const list = await listChildren(pid)
    return { code: 0, data: list }
  })

  fastify.post('/api/children', async (req) => {
    const pid = requireParentId(req)
    const body = req.body as { nickname?: string; age?: number; avatar_url?: string }
    if (!body.nickname || body.age === undefined) {
      return { code: 'VALIDATION', message: '昵称和年龄必填' }
    }
    const child = await createChild(pid, { nickname: body.nickname, age: body.age, avatar_url: body.avatar_url })
    return { code: 0, data: child }
  })

  fastify.put('/api/children/:id', async (req) => {
    const pid = requireParentId(req)
    const { id } = req.params as { id: string }
    const body = req.body as { nickname?: string; age?: number; avatar_url?: string | null }
    const child = await updateChild(pid, Number(id), body)
    return { code: 0, data: child }
  })

  fastify.delete('/api/children/:id', async (req) => {
    const pid = requireParentId(req)
    const { id } = req.params as { id: string }
    await deleteChild(pid, Number(id))
    return { code: 0, data: { deleted: true } }
  })
}
