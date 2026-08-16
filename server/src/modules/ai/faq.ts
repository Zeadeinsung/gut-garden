import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface FaqEntry {
  id: string
  question: string
  keywords: string[]
  answer: string
}

export interface FaqSummary {
  id: string
  question: string
  answer: string
}

const FAQS: FaqEntry[] = JSON.parse(readFileSync(path.resolve(__dirname, '../../config/faq-presets.json'), 'utf-8'))

export function listFaq(): FaqSummary[] {
  return FAQS.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))
}

export function getAllFaqs(): FaqEntry[] {
  return FAQS
}

const DEFAULT_ANSWER =
  '这个问题有点难住我啦～ 不过肠道小花园有好多好玩的事，你可以问我「为什么要吃蔬菜」或者「每天要喝多少水」哦！家长可查看详细解释'

export function matchFaq(message: string): string {
  const text = String(message || '')
  let best: { answer: string; hits: number } | null = null
  for (const f of FAQS) {
    const hits = f.keywords.filter((k) => text.includes(k)).length
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { answer: f.answer, hits }
    }
  }
  return best?.answer ?? DEFAULT_ANSWER
}
