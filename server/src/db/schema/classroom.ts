import { pgTable, bigserial, bigint, varchar, integer, boolean, date, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const knowledgeModuleProgress = pgTable('knowledge_module_progress', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  moduleCode: varchar('module_code', { length: 30 }).notNull(),
  cardsUnlocked: integer('cards_unlocked').notNull().default(0),
  cardsTotal: integer('cards_total').notNull().default(5),
  quizzesPassed: integer('quizzes_passed').notNull().default(0),
  animationWatched: boolean('animation_watched').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => [uniqueIndex('uk_module_child').on(t.childId, t.moduleCode)])

export const quizRecords = pgTable('quiz_records', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  quizDate: date('quiz_date').notNull(),
  moduleCode: varchar('module_code', { length: 30 }),
  questionType: varchar('question_type', { length: 20 }).notNull(),
  question: varchar('question', { length: 500 }).notNull(),
  answerCorrect: boolean('answer_correct').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_quiz_child_date').on(t.childId, t.quizDate),
  index('idx_quiz_child').on(t.childId),
])
