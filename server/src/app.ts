import 'dotenv/config'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { env } from './config/env.js'
import responsePlugin from './plugins/response.js'
import authPlugin from './plugins/auth.js'
import authRoutes from './modules/auth/auth.routes.js'
import childrenRoutes from './modules/children/children.routes.js'
import gardenRoutes from './modules/garden/garden.routes.js'
import checkinRoutes from './modules/checkin/checkin.routes.js'
import stoolRoutes from './modules/stool/stool.routes.js'
import classroomRoutes from './modules/classroom/classroom.routes.js'
import badgeRoutes from './modules/badges/badges.routes.js'
import reportRoutes from './modules/report/report.routes.js'
import aiRoutes from './modules/ai/ai.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'
import friendsRoutes from './modules/friends/friends.routes.js'
import cron from 'node-cron'
import { runDailyReset } from './cron/daily-reset.js'

const server = Fastify({ logger: true })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_DIST = path.resolve(__dirname, '../../web/dist')
const isSingleProcess = existsSync(path.join(WEB_DIST, 'index.html'))

await server.register(cors, { origin: true })
await server.register(jwt, { secret: env.jwtSecret, sign: { expiresIn: env.accessTokenTtl } })
await server.register(multipart)
await server.register(responsePlugin)
await server.register(authPlugin)

server.get('/api/health', async () => ({ code: 0, data: 'ok' }))

await server.register(authRoutes)
await server.register(childrenRoutes)
await server.register(gardenRoutes)
await server.register(checkinRoutes)
await server.register(stoolRoutes)
await server.register(classroomRoutes)
await server.register(badgeRoutes)
await server.register(reportRoutes)
await server.register(aiRoutes)
await server.register(adminRoutes)
await server.register(friendsRoutes)

if (isSingleProcess) {
  // 单进程部署：后端托管前端构建产物，SPA 路由回退到 index.html
  await server.register(fastifyStatic, { root: WEB_DIST, wildcard: false })
  server.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api')) {
      return reply.sendFile('index.html')
    }
    return reply.code(404).send({ code: 404, message: 'Not Found' })
  })
}

cron.schedule('0 0 * * *', () => {
  runDailyReset().catch((err) => server.log.error(err))
}, { timezone: 'UTC' })

try {
  await server.listen({ port: env.port, host: '0.0.0.0' })
  console.log(`Server running at http://localhost:${env.port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
