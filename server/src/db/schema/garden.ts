import { pgTable, bigserial, bigint, varchar, smallint, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core'

export const gardenStates = pgTable('garden_states', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull().unique(),
  currentState: varchar('current_state', { length: 20 }).notNull().default('healthy'),
  moistureLevel: smallint('moisture_level').notNull().default(50),
  growthStage: smallint('growth_stage').notNull().default(1),
  gardenXp: integer('garden_xp').notNull().default(0),
  unlockedFeatures: jsonb('unlocked_features').notNull().default([]),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
})

export const gardenActionLogs = pgTable('garden_action_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  actionType: varchar('action_type', { length: 30 }).notNull(),
  actionDetail: jsonb('action_detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_garden_log_child_time').on(t.childId, t.createdAt),
  index('idx_garden_log_daily').on(t.childId, t.actionType),
])
