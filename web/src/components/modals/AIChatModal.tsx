import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { apiStream } from '@/lib/api'
import { sfx } from '@/lib/sound'
import { toast } from '@/components/ui/Toast'
import { UiIcon } from '@/lib/uiIcons'

interface Message {
  role: 'user' | 'ai'
  content: string
}

function pageFromPath(pathname: string): string {
  const map: Record<string, string> = {
    '/checkin': 'checkin',
    '/garden': 'garden',
    '/classroom': 'classroom',
    '/stool': 'stool',
    '/badge': 'badge',
    '/profile': 'profile',
    '/report': 'report',
  }
  return map[pathname] ?? 'home'
}

const QUICK_QUESTIONS = ['为什么要吃蔬菜？', '酸奶有好处吗？', '为什么放屁会臭？', '每天要喝多少水？']

export default function AIChatModal() {
  const setAiChatOpen = useUIStore((s) => s.setAiChatOpen)
  const { pathname } = useLocation()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: '嗨！我是菌小园，你的肠道小导游～ 有什么想问的吗？' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || loading) return
    sfx.notification()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content }])
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'ai', content: '' }])

    const history = messages
      .filter((m) => m.content.trim())
      .slice(-6)
      .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

    let acc = ''
    await apiStream(
      '/ai/chat',
      { message: content, page: pageFromPath(pathname), history },
      (chunk) => {
        acc += chunk
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'ai', content: acc }
          return next
        })
      },
      () => {
        if (!acc) toast('菌小园开小差了，稍后再试试吧～', 'error')
      }
    )
    setLoading(false)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAiChatOpen(false)} />
      <div className="relative bg-white/95 backdrop-blur rounded-2xl shadow-2xl w-full max-w-[420px] max-h-[80vh] mx-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/assets/characters/png/char_xiaoyuan.webp" alt="菌小园" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="font-bold text-garden-forest text-sm">菌小园</h2>
              <p className="text-[10px] text-gray-400">你的肠道小导游</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600" onClick={() => setAiChatOpen(false)}><UiIcon name="close" size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3 min-h-[240px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-garden-mascot text-white rounded-br-sm'
                    : 'bg-garden-cream text-gray-700 rounded-bl-sm'
                }`}
              >
                {m.content || (loading && i === messages.length - 1 ? '...' : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                className="text-[11px] text-garden-forest bg-garden-cream rounded-full px-3 py-1.5 hover:bg-garden-sky/40 transition-colors"
                onClick={() => send(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 border-t border-gray-100 shrink-0 flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-garden-forest transition-colors"
            placeholder="问问菌小园..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-garden-mascot text-white hover:bg-[#7A9538] active:scale-95 transition-all disabled:opacity-50"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
