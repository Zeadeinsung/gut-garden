import fs from 'node:fs'
import { env } from '../../config/env'
import { throwError } from '../../config/errors'
import { BRISTOL_PRESETS } from './stool.presets'

export interface AnalysisResult {
  bristol_type: number
  diagnosis: string
  task_suggestion: string
  is_valid: boolean
}

const TIMEOUT_MS = 30_000

/**
 * 照片分析客户端。
 * - 配置了 STOOL_API_KEY + STOOL_API_URL → 调外部 API（兼容 OpenAI 风格响应，字段映射见下）
 * - 未配置（默认）→ 本地规则模拟，保证开发环境可用；STOOL_MOCK=false 时依然返回模拟结果（无真实 API 兜底）
 */
export async function analyzeStoolPhoto(imagePath: string): Promise<AnalysisResult> {
  if (env.stoolApiKey && env.stoolApiUrl) {
    try {
      return await callExternalApi(imagePath)
    } catch {
      throwError('STOOL_003')
    }
  }
  return mockAnalyze(imagePath)
}

async function callExternalApi(imagePath: string): Promise<AnalysisResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const data = fs.readFileSync(imagePath)
    const form = new FormData()
    form.append('image', new Blob([data]), 'stool.jpg')
    const res = await fetch(env.stoolApiUrl!, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.stoolApiKey}` },
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`stool api status ${res.status}`)
    const json = (await res.json()) as {
      bristol_type?: number
      bristol?: number
      diagnosis?: string
      suggestion?: string
      task_suggestion?: string
      is_valid?: boolean
      valid?: boolean
    }
    const bristol = Number(json.bristol_type ?? json.bristol)
    if (!bristol || bristol < 1 || bristol > 7) throw new Error('invalid bristol type')
    const preset = BRISTOL_PRESETS[bristol]
    const valid = json.is_valid ?? json.valid ?? true
    return {
      bristol_type: bristol,
      diagnosis: json.diagnosis || preset.diagnosis,
      task_suggestion: json.task_suggestion || json.suggestion || preset.task_suggestion,
      is_valid: valid,
    }
  } finally {
    clearTimeout(timer)
  }
}

/** 本地模拟：按文件大小确定性生成一个 Bristol 类型，方便联调不同形态 */
function mockAnalyze(imagePath: string): AnalysisResult {
  const size = fs.statSync(imagePath).size
  const bristol = (size % 7) + 1
  const preset = BRISTOL_PRESETS[bristol]
  return { bristol_type: bristol, diagnosis: preset.diagnosis, task_suggestion: preset.task_suggestion, is_valid: true }
}
