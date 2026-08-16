import { pgTable, bigserial, bigint, varchar, boolean, jsonb, smallint, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const badgeDefs = pgTable('badge_defs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 50 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(),
  description: varchar('description', { length: 200 }),
  conditionRule: jsonb('condition_rule').notNull(),
  silverRule: jsonb('silver_rule'),
  goldRule: jsonb('gold_rule'),
  sortOrder: smallint('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
})

export const badgeAwards = pgTable('badge_awards', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  badgeDefId: bigint('badge_def_id', { mode: 'number' }).notNull(),
  rarity: varchar('rarity', { length: 10 }).notNull().default('bronze'),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
  upgradedAt: timestamp('upgraded_at', { withTimezone: true }),
  eventId: varchar('event_id', { length: 100 }),
}, (t) => [
  uniqueIndex('uk_badge_child_def_rarity').on(t.childId, t.badgeDefId, t.rarity),
  uniqueIndex('uk_badge_event').on(t.eventId, t.badgeDefId),
  index('idx_badge_child').on(t.childId),
])
