import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { knowledgeModuleProgress, quizRecords } from '../../db/schema/index.js'
import { MODULE_ORDER, MODULE_DEFS, findQuiz, type ModuleCode, type QuizContent } from './classroom.content.js'
import { addGardenXp, todayLocal } from '../garden/garden.service.js'
import { onQuizEvent } from '../badges/badge-hooks.js'
import { throwError } from '../../config/errors'

const QUIZ_XP = 3
const WATCH_XP = 5

export async function listModules(childId: number) {
  if (!childId) throwError('CHILD_001')
  const progress = await db.select().from(knowledgeModuleProgress).where(eq(knowledgeModuleProgress.childId, childId))
  const byCode = new Map(progress.map((p) => [p.moduleCode, p]))

  return MODULE_ORDER.map((code) => {
    const def = MODULE_DEFS[code]
    const p = byCode.get(code)
    return {
      module_code: code,
      name: def.name,
      description: def.description,
      cards_unlocked: p?.cardsUnlocked ?? 0,
      cards_total: def.cards.length,
      quizzes_passed: p?.quizzesPassed ?? 0,
      quizzes_total: def.quizzes.length,
      animation_watched: p?.animationWatched ?? false,
      completed: Boolean(p?.completedAt),
    }
  })
}

export async function recordVideoWatched(childId: number, moduleCode: string) {
  if (!childId) throwError('CHILD_001')
  const def = MODULE_DEFS[moduleCode as ModuleCode]
  if (!def) throwError('CLASSROOM_001')

  const progress = await getOrCreateProgress(childId, moduleCode as ModuleCode)

  let xpGained = 0
  if (!progress.animationWatched) {
    const cardsUnlocked = Math.max(progress.cardsUnlocked, 1)
    await db
      .update(knowledgeModuleProgress)
      .set({ animationWatched: true, cardsUnlocked })
      .where(eq(knowledgeModuleProgress.id, progress.id))
    xpGained = WATCH_XP
    await addGardenXp(childId, WATCH_XP)
  }

  const [updated] = await db
    .select()
    .from(knowledgeModuleProgress)
    .where(eq(knowledgeModuleProgress.id, progress.id))

  return {
    module_code: moduleCode,
    animation_watched: updated.animationWatched,
    cards_unlocked: updated.cardsUnlocked,
    cards_total: def.cards.length,
    quizzes_passed: updated.quizzesPassed,
    xp_gained: xpGained,
  }
}

export async function getCards(moduleCode: string) {
  const def = MODULE_DEFS[moduleCode as ModuleCode]
  if (!def) throwError('CLASSROOM_001')
  return def.cards.map((c) => ({
    id: c.id,
    module_code: def.module_code,
    title: c.title,
    front_image: c.front_image,
    back_content: c.back_content,
    child_summary: c.child_summary,
    parent_detail: c.parent_detail,
  }))
}

function normalizeAnswer(answer: unknown): number[] {
  if (Array.isArray(answer)) return answer.map(Number)
  return [Number(answer)]
}

function isCorrect(q: QuizContent, answer: unknown): boolean {
  const expected = Array.isArray(q.answer) ? q.answer.map(Number) : [Number(q.answer)]
  const given = normalizeAnswer(answer)
  return JSON.stringify(expected) === JSON.stringify(given)
}

async function getOrCreateProgress(childId: number, moduleCode: ModuleCode) {
  let [row] = await db
    .select()
    .from(knowledgeModuleProgress)
    .where(and(eq(knowledgeModuleProgress.childId, childId), eq(knowledgeModuleProgress.moduleCode, moduleCode)))
  if (!row) {
    const [created] = await db
      .insert(knowledgeModuleProgress)
      .values({ childId, moduleCode, cardsTotal: MODULE_DEFS[moduleCode].cards.length })
      .returning()
    row = created
  }
  return row
}

export async function answerQuiz(childId: number, questionId: string, answer: unknown) {
  if (!childId) throwError('CHILD_001')
  const q = findQuiz(questionId)
  if (!q) throwError('CLASSROOM_002')

  const correct = isCorrect(q, answer)
  const correctAnswer = Array.isArray(q.answer) ? q.answer : Number(q.answer)

  await db.insert(quizRecords).values({
    childId,
    quizDate: todayLocal(),
    moduleCode: q.module_code,
    questionType: q.type,
    question: q.question,
    answerCorrect: correct,
  })

  let xpGained = 0
  let moduleCompleted = false
  let quizzesPassed = 0

  if (correct) {
    const progress = await getOrCreateProgress(childId, q.module_code)
    quizzesPassed = progress.quizzesPassed + 1
    const total = MODULE_DEFS[q.module_code].quizzes.length
    moduleCompleted = quizzesPassed >= total

    await db
      .update(knowledgeModuleProgress)
      .set({
        quizzesPassed: quizzesPassed,
        completedAt: moduleCompleted ? new Date() : progress.completedAt,
      })
      .where(eq(knowledgeModuleProgress.id, progress.id))

    xpGained = QUIZ_XP
    await addGardenXp(childId, QUIZ_XP)
  }

  const badges = await onQuizEvent(childId)
  return {
    correct,
    xp_gained: xpGained,
    correct_answer: correctAnswer,
    answer_hint: correct ? null : q.answer_hint,
    module_completed: moduleCompleted,
    quizzes_passed: quizzesPassed,
    badges_awarded: badges,
  }
}
