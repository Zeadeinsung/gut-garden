import { env } from '../../config/env.js'
import { BRISTOL_PRESETS } from './stool.presets.js'

export interface StoolAiSuggestion {
  child_sentence: string
  suggestion: string
  parent_note: string
  red_flag: boolean
  red_flag_text: string
  source: 'ai' | 'preset'
}

/** 便便建议垂直 AI 的 system prompt（与比赛文档附录一致） */
export const STOOL_AI_SYSTEM_PROMPT = `你是「便便小医生」——肠道花园 App 里专门负责「便便观察与饮食建议」的垂直 AI 助手。
你的唯一职责：根据孩子记录的便便形态（Bristol 1-7 型），用儿童能懂的语言给出健康提示和今天可执行的饮食行动建议，并给家长一句专业观察说明。

【输入】（由系统组装为 JSON 传入）
{ "bristol_type": 1-7, "description": "用户补充描述，可空", "recent_diet": "近期饮食/喝水情况，可空" }

【知识底座（只依据这里，禁止编造）】
- Type 1 兔子便便·干硬：多喝水，多吃纤维丰富的蔬菜
- Type 2 香肠便便·干硬：多喝水，多吃蔬果，适量运动
- Type 3 条状便便·正常：继续均衡饮食，注意补充水分
- Type 4 香蕉便·非常健康：继续保持均衡饮食
- Type 5 软块便便·正常：注意多喝水，多吃蔬菜
- Type 6 糊状便便·需关注：调整饮食，多吃纤维食物，多喝水
- Type 7 水样便便·需关注：补充水分；若持续需就医

【输出格式 —— 必须严格按此 JSON 结构，不要输出其他内容】
{
  "child_sentence": "给孩子的 1 句话，≤30 字，活泼、用比喻（如「便便像小香蕉，非常健康，继续加油！」）",
  "suggestion": "1-2 条今日可执行的饮食/喝水/运动建议（面向孩子，具体可做到）",
  "parent_note": "给家长的一句话专业说明，≤60 字（说明 Bristol 类型含义与观察要点）",
  "red_flag": false,
  "red_flag_text": "仅当 red_flag 为 true 时填写"
}

【硬性规则】
1. 只依据知识底座回答，绝不编造 Bristol 类型含义、营养成分、疾病名称、药物名称。
2. 不提供医疗诊断、不用药建议、不制造恐慌。
3. red_flag 仅当描述含以下任一时为 true：持续腹痛、血便、高热、严重脱水、水样便持续超过 24 小时；
   red_flag_text 固定给出：「请马上告诉爸爸妈妈，必要时去医院检查」，并补充具体原因。
4. 给孩子的句子要活泼、多用比喻，像和朋友聊天；给家长的说明要专业但不吓人，给出可观察要点。
5. 与便便/肠道健康无关的问题，礼貌引导回主题。
6. 始终用中文。`

const TIMEOUT_MS = 15_000

export function presetSuggestion(bristol: number): StoolAiSuggestion {
  const p = BRISTOL_PRESETS[bristol]
  return {
    child_sentence: p?.diagnosis ?? '基本正常',
    suggestion: p?.task_suggestion ?? '',
    parent_note: `布里斯托 ${bristol} 型便便，${p ? '请按知识库建议观察' : ''}`,
    red_flag: false,
    red_flag_text: '',
    source: 'preset',
  }
}

export function extractJson(text: string): StoolAiSuggestion | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const obj = JSON.parse(text.slice(start, end + 1))
    return {
      child_sentence: String(obj.child_sentence ?? '').slice(0, 80),
      suggestion: String(obj.suggestion ?? '').slice(0, 150),
      parent_note: String(obj.parent_note ?? '').slice(0, 150),
      red_flag: obj.red_flag === true || obj.red_flag === 'true',
      red_flag_text: String(obj.red_flag_text ?? ''),
      source: 'ai',
    }
  } catch {
    return null
  }
}

/**
 * 生成便便建议。AI_API_KEY 未配置 / 上游失败 / 输出无法解析时，
 * 一律降级为 Bristol 预设建议，保证记录流程永不中断。
 */
export async function generateStoolSuggestion(input: { bristol_type: number; description?: string }): Promise<StoolAiSuggestion> {
  const fallback = presetSuggestion(input.bristol_type)
  if (!env.aiApiKey) return fallback

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const base = (env.aiBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '')
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.aiApiKey}` },
      body: JSON.stringify({
        model: env.aiModel || 'qwen-flash',
        messages: [
          { role: 'system', content: STOOL_AI_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify({ bristol_type: input.bristol_type, description: input.description ?? '', recent_diet: null }) },
        ],
        temperature: 0.4,
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`AI upstream ${res.status}`)
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const content = json.choices?.[0]?.message?.content ?? ''
    if (!content) return fallback
    return extractJson(content) ?? fallback
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}
