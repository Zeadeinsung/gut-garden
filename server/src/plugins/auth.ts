import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'

export default fp(async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', async (req) => {
    req.user = null
    const auth = req.headers.authorization
    if (auth && auth.startsWith('Bearer ')) {
      try {
        req.user = fastify.jwt.verify(auth.slice(7)) as { parent_id?: number; phone?: string; role?: string }
      } catch {
        req.user = null
      }
    }
  })
})
