import { toast } from '@/components/ui/Toast'

const BASE = '/api'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

interface Envelope<T> {
  code: number
  data: T
  message?: string
}

function handleUnauthorized() {
  localStorage.removeItem('token')
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

function mergeHeaders(opts?: RequestInit): Record<string, string> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  if (!(opts?.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return { ...headers, ...(opts?.headers as Record<string, string> | undefined) }
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: mergeHeaders(opts) })
  if (res.status === 401 && !path.startsWith('/auth/')) {
    handleUnauthorized()
  }
  let json: Envelope<T>
  try {
    json = (await res.json()) as Envelope<T>
  } catch {
    throw new ApiError('INTERNAL', '服务器开小差了，请稍后再试', res.status)
  }
  if (json.code !== 0) {
    const message = json.message || '请求失败，请稍后再试'
    toast(message, 'error')
    throw new ApiError(String(json.code || 'UNKNOWN'), message, res.status)
  }
  return json.data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
}

/**
 * SSE 流式请求：POST body，逐块回调解析 `data: {json}` 事件。
 * 事件格式：{type:'start'|'chunk'|'done', content?}
 */
export async function apiStream(
  path: string,
  body: unknown,
  onChunk: (content: string) => void,
  onError?: (err: unknown) => void
): Promise<void> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: mergeHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok || !res.body) throw new ApiError('AI_001', 'AI 服务暂时不可用', res.status)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''
      for (const part of parts) {
        for (const line of part.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          try {
            const event = JSON.parse(trimmed.slice(5).trim()) as { type: string; content?: string }
            if (event.type === 'chunk' && event.content) onChunk(event.content)
            if (event.type === 'done') return
          } catch {
            // ignore malformed events
          }
        }
      }
    }
  } catch (err) {
    onError?.(err)
  }
}
