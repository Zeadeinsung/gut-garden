import type { FastifyInstance, FastifyReply } from 'fastify'
import { listFaq, matchFaq } from './faq.js'
import { streamAiChunks, type ChatMessage } from './ai-stream.js'
import { buildKnowledgeText, buildPageHint } from './knowledge-base.js'
import { AI_STYLE_GUIDE } from '../../config/ai-style-guide.js'

function badRequest(reply: FastifyReply, message: string): FastifyReply {
  return reply.status(400).send({ code: 'VALIDATION', message })
}

function buildMessages(message: string, page?: string, history?: { role?: string; content?: string }[]): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: `${AI_STYLE_GUIDE}\n\n## 知识底座\n${buildKnowledgeText()}` },
  ]
  if (page) messages.push({ role: 'system', content: buildPageHint(page) })
  for (const h of history ?? []) {
    const role = h?.role === 'assistant' ? 'assistant' : h?.role === 'user' ? 'user' : null
    const content = String(h?.content ?? '').trim()
    if (role && content) messages.push({ role, content })
  }
  messages.push({ role: 'user', content: message })
  return messages
}

export default async function aiRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/ai/faq', async () => {
    return { code: 0, data: { faqs: listFaq() } }
  })

  fastify.post('/api/ai/chat', async (req, reply) => {
    const { message, page, history } = req.body as {
      message?: string
      page?: string
      history?: { role?: string; content?: string }[]
    }
    const text = String(message || '').trim()
    if (!text) return badRequest(reply, 'message 必填')

    const messages = buildMessages(text, page, (history ?? []).slice(-6))

    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    const send = (obj: Record<string, unknown>) => reply.raw.write(`data: ${JSON.stringify(obj)}\n\n`)

    send({ type: 'start' })
    let sent = false
    try {
      for await (const chunk of streamAiChunks(messages)) {
        if (chunk) {
          send({ type: 'chunk', content: chunk })
          sent = true
        }
      }
    } catch {
      // fallback below
    }
    if (!sent) send({ type: 'chunk', content: matchFaq(text) })
    send({ type: 'done' })
    reply.raw.end()
  })
}
