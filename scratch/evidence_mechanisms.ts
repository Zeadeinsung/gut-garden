/**
 * 科学准确性 · 四类机制运行证据（一条命令，终端截图即可）：
 *   0) 查输入     —— 非法手机号被后端拒绝（打真实接口）
 *   1) 注入约束   —— system prompt 硬性规则 + 便便垂直 AI 输出约束 + 知识底座样本
 *   2) 生成后校验 —— extractJson 对坏输出返回 null → 触发回退
 *   3) 兜底降级   —— 有 AI_API_KEY 走真实 AI（source=ai）；无 Key 走预设（source=preset）
 * 运行：cd server && npx tsx ../scratch/evidence_mechanisms.ts
 *       （截「有 Key」图后再跑一次 DASHSCOPE_API_KEY= npx tsx ../scratch/evidence_mechanisms.ts 截「无 Key」图）
 */
import { AI_STYLE_GUIDE } from '../server/src/config/ai-style-guide.js'
import { env } from '../server/src/config/env.js'
import { STOOL_AI_SYSTEM_PROMPT, extractJson, presetSuggestion, generateStoolSuggestion } from '../server/src/modules/stool/stool-ai.js'
import { getAllFaqs } from '../server/src/modules/ai/faq.js'

const sep = '='.repeat(70)

async function post(path: string, body: object) {
  const r = await fetch('http://localhost:3001' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: r.status, body: await r.json() }
}

async function main() {
  console.log(sep)
  console.log('【0】查输入 —— 非法手机号被后端校验拒绝（真实接口返回）')
  console.log(sep)
  try {
    const a = await post('/api/auth/send-code', { phone: 'abc' })
    console.log(`POST /api/auth/send-code  phone=abc\n  → HTTP ${a.status}  ${JSON.stringify(a.body)}`)
    const b = await post('/api/auth/send-code', { phone: '123' })
    console.log(`POST /api/auth/send-code  phone=123\n  → HTTP ${b.status}  ${JSON.stringify(b.body)}`)
    const c = await post('/api/auth/send-code', { phone: '13900001111' })
    const d = await post('/api/auth/send-code', { phone: '13900001111' })
    console.log(`POST /api/auth/send-code  phone=13900001111 连续2次（60s 限频）\n  → 第1次 HTTP ${c.status}  ${JSON.stringify(c.body)}`)
    console.log(`  → 第2次 HTTP ${d.status}  ${JSON.stringify(d.body)}`)
  } catch (e: unknown) {
    console.log('（无法连接后端，请先启动 server 再跑本脚本）', (e as Error).message)
  }

  console.log('\n' + sep)
  console.log('【1】注入约束 —— AI 导游 system prompt 的硬性规则（禁止编造/禁止诊断/引导就医）')
  console.log(sep)
  console.log(AI_STYLE_GUIDE)

  console.log('\n' + sep)
  console.log('【1.2】注入约束 —— 便便垂直 AI 的输出格式约束（强制严格 JSON 结构）')
  console.log(sep)
  console.log(STOOL_AI_SYSTEM_PROMPT)

  console.log('\n' + sep)
  console.log('【1.3】注入约束 —— 知识底座内容样本（由已验证数据文件组装，注入 system prompt）')
  console.log(sep)
  for (const f of getAllFaqs()) {
    console.log(`- 问：${f.question}\n  → ${f.answer}`)
  }

  console.log('\n' + sep)
  console.log('【2】生成后校验 —— extractJson 对非法模型输出返回 null（触发降级）')
  console.log(sep)
  const good = JSON.stringify({
    child_sentence: '便便像小香蕉，非常健康，继续加油！',
    suggestion: '今天多吃一点蔬菜哦',
    parent_note: '布里斯托 4 型，形态正常',
    red_flag: false,
    red_flag_text: '',
  })
  const badList = [
    '只输出了半截 { "child_sentence": "便便像小香蕉", 没有闭合括号',
    '{child_sentence: "用了单引号且键没加引号"}',
    '模型开始胡言乱语……完全不是 JSON',
  ]
  console.log('合法输出 → extractJson =', JSON.stringify(extractJson(good)))
  for (const bad of badList) {
    const r = extractJson(bad)
    console.log(`非法输出 "${bad.slice(0, 24)}…" → extractJson = ${r === null ? 'null（判定失败 → 走预设兜底）' : JSON.stringify(r)}`)
  }

  console.log('\n' + sep)
  console.log(`【3】兜底降级 —— 当前 AI_API_KEY：${env.aiApiKey ? '已配置（走真实 AI）' : '未配置（走预设）'}`)
  console.log(sep)
  for (const b of [1, 4, 7]) {
    const s = await generateStoolSuggestion({ bristol_type: b })
    console.log(`Bristol ${b} 型 → source=${s.source} | 孩子话术：${s.child_sentence}`)
    console.log(`                  建议：${s.suggestion}`)
  }
  console.log('\n对比 presetSuggestion(4) 直接产物 =', JSON.stringify(presetSuggestion(4)))
  console.log('\n提示：用 DASHSCOPE_API_KEY= 前缀再跑一次，可截到 source=preset 的兜底效果。')
}

main()
