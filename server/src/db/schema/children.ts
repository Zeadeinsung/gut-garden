import { pgTable, bigserial, bigint, varchar, smallint, timestamp, index } from 'drizzle-orm/pg-core'

export const children = pgTable('children', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  parentId: bigint('parent_id', { mode: 'number' }).notNull(),
  nickname: varchar('nickname', { length: 30 }).notNull(),
  age: smallint('age').notNull(),
  dailyLimitMinutes: smallint('daily_limit_minutes').notNull().default(30),
  avatarUrl: varchar('avatar_url', { length: 300 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_children_parent').on(t.parentId)])
