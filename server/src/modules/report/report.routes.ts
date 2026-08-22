import type { FastifyInstance, FastifyReply } from 'fastify'
import { requireParentId } from '../auth/auth.routes.js'
import { generateReport, getHistory, weekRange, monthRange } from './report.service.js'

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ code: 'VALIDATION', message })
}

function isEmpty(r: Record<string, unknown>): boolean {
  const key = r as {
    checkin_rate: number
    stool_count: number
    feed_count: number
    quiz_accuracy: number
    badges: { total: number }
  }
  return key.checkin_rate === 0 && key.stool_count === 0 && key.feed_count === 0 && key.quiz_accuracy === 0 && key.badges.total === 0
}

export default async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/report/weekly', async (req, reply) => {
    requireParentId(req)
    const { child_id, week } = req.query as { child_id?: string; week?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    const data = await generateReport(childId, 'week', weekRange(week))
    return { code: 0, data: isEmpty(data as never) ? null : data }
  })

  fastify.get('/api/report/monthly', async (req, reply) => {
    requireParentId(req)
    const { child_id, month } = req.query as { child_id?: string; month?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    const data = await generateReport(childId, 'month', monthRange(month))
    return { code: 0, data: isEmpty(data as never) ? null : data }
  })

  fastify.get('/api/report/history', async (req, reply) => {
    requireParentId(req)
    const { child_id, days } = req.query as { child_id?: string; days?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    const n = Math.max(1, Math.min(30, Number(days) || 7))
    return { code: 0, data: await getHistory(childId, n) }
  })
}
