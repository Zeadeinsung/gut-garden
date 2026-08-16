import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { sendLoginCode, loginWithCode, getUserData } from './auth.service.js'
import { migrateGuest, type GuestMigratePayload } from './migrate.service.js'
import { throwError } from '../../config/errors'
import type { UserData } from '../../lib/mappers'

export function requireParentId(req: { user?: { parent_id?: number } | null }): number {
  const pid = req.user?.parent_id
  if (!pid) throwError('AUTH_003')
  return pid
}

function signToken(fastify: FastifyInstance, parentId: number, phone: string, role = 'parent'): string {
  return fastify.jwt.sign({ parent_id: parentId, phone, role })
}

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ code: 'VALIDATION', message })
}

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/api/auth/send-code', async (req, reply) => {
    const { phone } = req.body as { phone?: string }
    if (!phone || !/^\d{6,15}$/.test(phone)) return badRequest(reply, '手机号格式不正确')
    sendLoginCode(phone)
    return { code: 0, data: { sent: true } }
  })

  fastify.post('/api/auth/verify-code', async (req, reply) => loginAndRespond(fastify, reply, req.body as { phone?: string; code?: string }))
  fastify.post('/api/auth/login', async (req, reply) => loginAndRespond(fastify, reply, req.body as { phone?: string; code?: string }))

  fastify.post('/api/auth/refresh', async (req) => {
    const pid = requireParentId(req)
    const phone = req.user?.phone || ''
    const role = req.user?.role || 'parent'
    return { code: 0, data: { token: signToken(fastify, pid, phone, role) } }
  })

  fastify.post('/api/auth/migrate', async (req) => {
    const pid = requireParentId(req)
    const profile = await migrateGuest(pid, req.body as GuestMigratePayload)
    return { code: 0, data: { child: profile } }
  })

  fastify.get('/api/auth/me', async (req) => {
    const pid = requireParentId(req)
    const phone = req.user?.phone || ''
    const user = await getUserData(pid, phone)
    return { code: 0, data: user }
  })
}

async function loginAndRespond(fastify: FastifyInstance, reply: FastifyReply, body: { phone?: string; code?: string }) {
  const { phone, code } = body
  if (!phone || !code) return badRequest(reply, '手机号和验证码不能为空')
  const { user, role } = await loginWithCode(phone, code)
  const token = signToken(fastify, user.parent_id, user.phone, role)
  return { code: 0, data: { token, user } }
}
