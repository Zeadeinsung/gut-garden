import { pgTable, bigserial, bigint, varchar, date, boolean, timestamp, smallint, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const checkinRecords = pgTable('checkin_records', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  checkinDate: date('checkin_date').notNull(),
  taskGarden: varchar('task_garden', { length: 10 }).notNull().default('pending'),
  taskEat: varchar('task_eat', { length: 10 }).notNull().default('pending'),
  taskEatContent: varchar('task_eat_content', { length: 100 }),
  taskEatSkipped: boolean('task_eat_skipped').notNull().default(false),
  taskEatSkipReason: varchar('task_eat_skip_reason', { length: 30 }),
  taskSleep: varchar('task_sleep', { length: 10 }).notNull().default('pending'),
  taskWater: varchar('task_water', { length: 10 }).notNull().default('pending'),
  taskSport: varchar('task_sport', { length: 10 }).notNull().default('pending'),
  subWater: boolean('sub_water').notNull().default(false),
  subVegetable: boolean('sub_vegetable').notNull().default(false),
  subFruit: boolean('sub_fruit').notNull().default(false),
  subOutdoor: boolean('sub_outdoor').notNull().default(false),
  subEarlySleep: boolean('sub_early_sleep').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  isMakeup: boolean('is_makeup').notNull().default(false),
  makeupDate: date('makeup_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uk_checkin_child_date').on(t.childId, t.checkinDate),
  index('idx_checkin_date').on(t.checkinDate),
])

export const checkinCalendar = pgTable('checkin_calendar', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  childId: bigint('child_id', { mode: 'number' }).notNull(),
  calendarDate: date('calendar_date').notNull(),
  status: varchar('status', { length: 10 }).notNull().default('miss'),
  subItemsCompleted: smallint('sub_items_completed').notNull().default(0),
  gardenIcon: varchar('garden_icon', { length: 30 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('uk_calendar_child_date').on(t.childId, t.calendarDate)])
