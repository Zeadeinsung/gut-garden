import type { FastifyInstance, FastifyReply } from 'fastify'
import { throwError } from '../../config/errors'
import { requireParentId } from '../auth/auth.routes.js'
import { selectIcon, uploadPhoto, getAnalysis, getLatest, stoolFilePath, fileExists, createReadStream, mimeOf } from './stool.service.js'

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ code: 'VALIDATION', message })
}

export default async function stoolRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/api/stool/select-icon', async (req, reply) => {
    const body = req.body as { child_id?: number; stool_icon_type?: string; bristol_type?: number }
    const childId = Number(body.child_id)
    if (!childId) return badRequest(reply, 'child_id 必填')
    const data = await selectIcon({ child_id: childId, stool_icon_type: body.stool_icon_type, bristol_type: body.bristol_type })
    return { code: 0, data }
  })

  fastify.post('/api/stool/upload', async (req, reply) => {
    if (!req.user?.parent_id) throwError('STOOL_005')
    let childId: number | undefined
    let file: { filename: string; mimetype: string; data: Buffer } | undefined

    for await (const part of req.parts()) {
      if (part.type === 'field') {
        if (part.fieldname === 'child_id') childId = Number(part.value)
      } else if (part.type === 'file') {
        file = { filename: part.filename, mimetype: part.mimetype, data: await part.toBuffer() }
      }
    }
    if (!childId) return badRequest(reply, 'child_id 必填')
    if (!file) return badRequest(reply, '请上传图片文件')

    const data = await uploadPhoto(childId, file)
    return { code: 0, data }
  })

  fastify.get('/api/stool/analysis/:id', async (req) => {
    requireParentId(req)
    const { id } = req.params as { id: string }
    const data = await getAnalysis(Number(id))
    return { code: 0, data }
  })

  fastify.get('/api/stool/latest', async (req) => {
    requireParentId(req)
    const { child_id } = req.query as { child_id?: string }
    const childId = Number(child_id)
    if (!childId) return { code: 'VALIDATION', message: 'child_id 必填' }
    const data = await getLatest(childId)
    return { code: 0, data }
  })

  fastify.get('/uploads/*', async (req, reply) => {
    const wildcard = (req.params as { '*': string })['*']
    const filePath = stoolFilePath(wildcard)
    if (!fileExists(filePath)) return reply.status(404).send({ code: 'NOT_FOUND', message: '文件不存在' })
    return reply.type(mimeOf(wildcard)).send(createReadStream(filePath))
  })
}
