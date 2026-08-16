import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { AppError } from '../lib/appError'

export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error, req, reply) => {
    if (error instanceof AppError) {
      reply.status(error.status).send({ code: error.code, message: error.message })
    } else if ((error as { validation?: unknown }).validation) {
      reply.status(400).send({ code: 'VALIDATION', message: '参数不正确' })
    } else {
      req.log.error(error)
      reply.status(500).send({ code: 'INTERNAL', message: '服务器开小差了，请稍后再试' })
    }
  })
})
