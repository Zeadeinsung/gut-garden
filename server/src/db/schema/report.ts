import { pgTable, bigserial, bigint, varchar, date, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const growthReportSnapshots = pgTable('growth_report_snapshots', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  periodType: varchar('period_type', { length: 5 }).notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  metrics: jsonb('metrics').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uk_report_child_period').on(t.childId, t.periodType, t.periodStart)])
