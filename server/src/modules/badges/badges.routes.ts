import type { FastifyInstance, FastifyReply } from 'fastify'
import { awardedBadges, pendingBadges, listBadgeDefs } from './engine.js'

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ code: 'VALIDATION', message })
}

export default async function badgeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/badges/awarded', async (req, reply) => {
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    return { code: 0, data: await awardedBadges(childId) }
  })

  fastify.get('/api/badges/pending', async (req, reply) => {
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    return { code: 0, data: await pendingBadges(childId) }
  })

  fastify.get('/api/badges/defs', async () => {
    return { code: 0, data: await listBadgeDefs() }
  })
}
