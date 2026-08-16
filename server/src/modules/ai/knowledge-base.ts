import { MODULE_DEFS, MODULE_ORDER } from '../classroom/classroom.content.js'
import { BRISTOL_PRESETS } from '../stool/stool.presets.js'
import { STAGE_REQS } from '../garden/stage.service.js'
import { getAllFaqs } from './faq.js'

/**
 * 全量知识底座：从应用内已验证内容动态生成，注入 system prompt。
 * 回答只能依据这里的内容，避免大模型幻觉 / 编造数字 / 医学表述错误。
 */
export function buildKnowledgeText(): string {
  const parts: string[] = []
  parts.push('【肠道小花园科普知识库】回答只能依据以下内容，不要编造任何条目。')

  parts.push('\n【知识模块】')
  for (const code of MODULE_ORDER) {
    const mod = MODULE_DEFS[code]
    parts.push(`\n■ ${mod.name}：${mod.description}`)
    for (const c of mod.cards) {
      parts.push(`- ${c.title}：${c.child_summary}（家长说明：${c.parent_detail}）`)
    }
    for (const q of mod.quizzes) {
      parts.push(`- 问答：${q.question} → ${q.answer_hint}`)
    }
  }

  parts.push('\n【便便 Bristol 分型】')
  for (let i = 1; i <= 7; i++) {
    const p = BRISTOL_PRESETS[i]
    parts.push(`- Type ${i}：${p.diagnosis}；建议：${p.task_suggestion}`)
  }

  parts.push('\n【花园成长阶段】')
  for (const s of STAGE_REQS) {
    parts.push(`- 第${s.stage}阶段「${s.label}」：累计打卡${s.checkinDays}天、投喂${s.feedCount}次、徽章${s.badgeCount}个${s.unlock ? `，解锁「${s.unlock}」` : ''}`)
  }

  parts.push('\n【常见问答】')
  for (const f of getAllFaqs()) {
    parts.push(`- 问：${f.question} → ${f.answer}`)
  }

  return parts.join('\n')
}

/** 页面引导：告诉 AI 用户当前在哪个页面、关心什么主题。 */
export function buildPageHint(page: string): string {
  const map: Record<string, string> = {
    checkin: '用户正在「每日打卡」页，这里有5个健康任务：探索花园、健康饮食、优质睡眠、补充水分、活力运动。',
    garden: '用户正在「探索花园」页，花园有6个成长阶段（种子→幼苗→成长→丰收→大师→终极），通过打卡、投喂、获得徽章升级。',
    classroom: '用户正在「探索课堂」页，有5个知识模块：膳食纤维广场、菌菌发酵坊、酸酸喷泉、屏障城堡、生态观察站。',
    stool: '用户正在「便便记录」页，可以用 Bristol 1-7 型描述便便形态。',
    badge: '用户正在「徽章」页，徽章通过连续打卡、投喂、答题、便便记录等行为获得。',
    profile: '用户正在「我的主页」，可查看统计数据和历史记录。',
    report: '用户正在「成长报告」页，可查看周报/月报。',
    home: '用户正在首页。',
  }
  return map[page] ?? '用户正在使用肠道花园 App。'
}
