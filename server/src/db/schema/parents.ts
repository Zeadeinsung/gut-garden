import { pgTable, bigserial, varchar, timestamp } from 'drizzle-orm/pg-core'

export const parents = pgTable('parents', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  role: varchar('role', { length: 10 }).notNull().default('parent'),
  status: varchar('status', { length: 10 }).notNull().default('active'),
})
