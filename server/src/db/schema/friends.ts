import { pgTable, bigserial, bigint, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const friendships = pgTable('friendships', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  friendChildId: bigint('friend_child_id', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uk_friendship_pair').on(t.childId, t.friendChildId),
])
