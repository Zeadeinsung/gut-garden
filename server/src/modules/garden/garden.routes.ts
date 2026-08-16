import type { FastifyInstance } from 'fastify'
import { getGardenState, logAction, todayInteractionCount, ensureChildExists } from './garden.service.js'
import { evaluate } from '../badges/engine.js'

export default async function gardenRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/garden/state', async (req) => {
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)
    if (!childId) return { code: 'VALIDATION', message: 'child_id 必填' }
    const data = await getGardenState(childId)
    return { code: 0, data }
  })

  fastify.get('/api/garden/actions/today-count', async (req) => {
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)
    if (!childId) return { code: 'VALIDATION', message: 'child_id 必填' }
    const count = await todayInteractionCount(childId)
    return { code: 0, data: { child_id: childId, interaction_count_today: count } }
  })

  fastify.post('/api/garden/log-action', async (req) => {
    const body = req.body as { child_id?: number; action_type?: string; action_detail?: Record<string, unknown> }
    const childId = Number(body.child_id)
    if (!childId) return { code: 'VALIDATION', message: 'child_id 必填' }
    const actionType = body.action_type
    if (!actionType || !['feed', 'explore', 'magnifier', 'treatment'].includes(actionType)) {
      return { code: 'VALIDATION', message: 'action_type 无效' }
    }
    await ensureChildExists(childId)
    const data = await logAction({ childId, actionType: actionType as never, actionDetail: body.action_detail })
    const badges = await evaluate(childId)
    return { code: 0, data: { ...data, badges_awarded: badges } }
  })
}
