import { env } from '../../config/env.js'
import { matchFaq } from './faq.js'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function* streamOpenAi(messages: ChatMessage[]): AsyncGenerator<string> {
  const base = env.aiBaseUrl.replace(/\/+$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.aiApiKey}`,
    },
    body: JSON.stringify({
      model: env.aiModel,
      stream: true,
      messages,
    }),
  })
  if (!res.ok || !res.body) throw new Error(`AI upstream ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        const json = JSON.parse(payload)
        const delta: unknown = json.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta) yield delta
      } catch {
        // skip malformed lines
      }
    }
  }
}

/**
 * 流式生成 AI 回答。AI_API_KEY 已配置时走 OpenAI 兼容流式接口；
 * 未配置 / 上游失败 / 无输出时降级为 FAQ 关键词匹配（取最后一条 user 消息）。
 */
export async function* streamAiChunks(messages: ChatMessage[]): AsyncGenerator<string> {
  if (env.aiApiKey) {
    let yielded = false
    try {
      for await (const chunk of streamOpenAi(messages)) {
        yielded = true
        yield chunk
      }
    } catch {
      // fall through to FAQ
    }
    if (yielded) return
  }
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  yield matchFaq(lastUser?.content ?? '')
}
