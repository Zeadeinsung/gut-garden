import type { FastifyInstance, FastifyReply } from 'fastify'
import { listModules, getCards, answerQuiz } from './classroom.service.js'

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ code: 'VALIDATION', message })
}

export default async function classroomRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/classroom/modules', async (req, reply) => {
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    return { code: 0, data: await listModules(childId) }
  })

  fastify.get('/api/classroom/modules/:code/cards', async (req) => {
    const { code } = req.params as { code: string }
    return { code: 0, data: await getCards(code) }
  })

  fastify.post('/api/classroom/quiz/answer', async (req, reply) => {
    const body = req.body as { child_id?: number; question_id?: string; answer?: unknown }
    const childId = Number(body.child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    if (!body.question_id) return badRequest(reply, 'question_id 必填')
    if (body.answer === undefined) return badRequest(reply, 'answer 必填')
    return { code: 0, data: await answerQuiz(childId, body.question_id, body.answer) }
  })
}
