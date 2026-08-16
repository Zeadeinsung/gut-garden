import type { FastifyInstance } from 'fastify'
import { runDailyReset } from '../../cron/daily-reset.js'
import { throwError } from '../../config/errors.js'

function requireAdmin(req: { user?: { role?: string } | null }): void {
  if (req.user?.role !== 'admin') throwError('AUTH_004')
}

export default async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/api/admin/cron/daily-reset', async (req) => {
    requireAdmin(req)
    const result = await runDailyReset()
    return { code: 0, data: result }
  })
}
