import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'

const server = Fastify({ logger: true })

await server.register(cors, { origin: true })
await server.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret' })
await server.register(multipart)

// Health check
server.get('/api/health', async () => ({ status: 'ok' }))

// Auth routes (stub)
server.post('/api/auth/send-code', async (req) => {
  const { phone } = req.body as { phone: string }
  return { code: 0, data: { mock: true, code: '123456' } }
})

server.post('/api/auth/login', async (req, reply) => {
  const { phone, code } = req.body as { phone: string; code: string }
  const token = server.jwt.sign({ parent_id: 1, phone })
  return { code: 0, token, user: { parent_id: 1, phone } }
})

// Children routes (stub)
server.get('/api/children', async (req) => {
  return { code: 0, data: [{ id: 1, nickname: '小宝', age: 4 }] }
})

// Garden routes (stub)
server.get('/api/garden/state', async () => ({
  code: 0, data: { current_state: 'healthy', moisture_level: 50, garden_level: 1, garden_xp: 0 }
}))

// Checkin routes (stub)
server.get('/api/checkin/today', async () => ({
  code: 0, data: { task_garden: 'pending', task_eat: 'pending', task_sleep: 'pending', all_completed: false }
}))

// Badge routes (stub)
server.get('/api/badges/awarded', async () => ({
  code: 0, data: []
}))

server.get('/api/badges/pending', async () => ({
  code: 0, data: []
}))

// Report routes (stub)
server.get('/api/report/weekly', async () => ({
  code: 0, data: { period: '2026-W30', metrics: {} }
}))

try {
  await server.listen({ port: 3001, host: '0.0.0.0' })
  console.log('Server running at http://localhost:3001')
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
