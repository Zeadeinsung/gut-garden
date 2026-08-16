import { pgTable, bigserial, bigint, varchar, smallint, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const stoolAnalyses = pgTable('stool_analyses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  checkinId: bigint('checkin_id', { mode: 'number' }),
  mode: varchar('mode', { length: 15 }).notNull().default('icon_selection'),
  stoolIconType: varchar('stool_icon_type', { length: 20 }),
  imageUrl: varchar('image_url', { length: 500 }),
  bristolType: smallint('bristol_type'),
  diagnosis: varchar('diagnosis', { length: 100 }),
  taskSuggestion: varchar('task_suggestion', { length: 100 }),
  apiRawResponse: jsonb('api_raw_response'),
  isValid: boolean('is_valid').notNull().default(true),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_stool_child').on(t.childId, t.uploadedAt),
  index('idx_stool_checkin').on(t.checkinId),
])
