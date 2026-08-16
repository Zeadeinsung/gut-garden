import type { FastifyInstance, FastifyReply } from 'fastify'
import { getToday, confirmTask, toggleSubItem, skipEatSuggestion, makeup, getCalendar } from './checkin.service.js'

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ code: 'VALIDATION', message })
}

export default async function checkinRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/checkin/today', async (req, reply) => {
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    return { code: 0, data: await getToday(childId) }
  })

  fastify.post('/api/checkin/confirm-task', async (req, reply) => {
    const body = req.body as { child_id?: number; task_code?: string }
    const childId = Number(body.child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    if (!body.task_code) return badRequest(reply, 'task_code 必填')
    return { code: 0, data: await confirmTask(childId, body.task_code) }
  })

  fastify.post('/api/checkin/toggle-sub-item', async (req, reply) => {
    const body = req.body as { child_id?: number; sub_item?: string }
    const childId = Number(body.child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    if (!body.sub_item) return badRequest(reply, 'sub_item 必填')
    return { code: 0, data: await toggleSubItem(childId, body.sub_item) }
  })

  fastify.post('/api/checkin/skip-eat-suggestion', async (req, reply) => {
    const body = req.body as { child_id?: number; reason?: string }
    const childId = Number(body.child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    return { code: 0, data: await skipEatSuggestion(childId, body.reason) }
  })

  fastify.post('/api/checkin/makeup', async (req, reply) => {
    const body = req.body as { child_id?: number; calendar_date?: string }
    const childId = Number(body.child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    if (!body.calendar_date) return badRequest(reply, 'calendar_date 必填')
    return { code: 0, data: await makeup(childId, body.calendar_date) }
  })

  fastify.get('/api/checkin/calendar', async (req, reply) => {
    const { child_id, month } = req.query as { child_id?: string; month?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    if (!month) return badRequest(reply, 'month 必填 (YYYY-MM)')
    return { code: 0, data: await getCalendar(childId, month) }
  })
}
