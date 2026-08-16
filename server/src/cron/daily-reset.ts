import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { children, checkinRecords, checkinCalendar, stoolAnalyses, growthReportSnapshots } from '../db/schema/index.js'
import { generateReport } from '../modules/report/report.service.js'
import { todayLocal } from '../modules/garden/garden.service.js'

function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return fmtDate(d)
}

const TASK_COLUMNS = ['taskGarden', 'taskEat', 'taskSleep', 'taskWater', 'taskSport'] as const

function isDoneStatus(status: string): boolean {
  return status === 'done' || status === 'auto_done'
}

async function ensureTodayRecords(): Promise<number> {
  const today = todayLocal()
  const rows = await db.select({ id: children.id }).from(children)
  let created = 0
  for (const c of rows) {
    const [res] = await db
      .insert(checkinRecords)
      .values({ childId: c.id, checkinDate: today })
      .onConflictDoNothing()
      .returning({ id: checkinRecords.id })
    if (res) created += 1
  }
  return created
}

async function expireStoolResults(): Promise<number> {
  const rows = await db
    .update(stoolAnalyses)
    .set({ isValid: false })
    .where(and(sql`${stoolAnalyses.expiresAt} < now()`, eq(stoolAnalyses.isValid, true)))
    .returning({ id: stoolAnalyses.id })
  return rows.length
}

async function syncCalendars(): Promise<number> {
  const rows = await db.select().from(checkinRecords)
  let synced = 0
  for (const r of rows) {
    const done = TASK_COLUMNS.every((col) => isDoneStatus(r[col]))
    const subCount = [r.subWater, r.subVegetable, r.subFruit, r.subOutdoor, r.subEarlySleep].filter(Boolean).length
    const status = done ? 'done' : r.isMakeup ? 'makeup' : 'miss'
    await db
      .insert(checkinCalendar)
      .values({ childId: r.childId, calendarDate: r.checkinDate, status, subItemsCompleted: subCount })
      .onConflictDoUpdate({
        target: [checkinCalendar.childId, checkinCalendar.calendarDate],
        set: { status, subItemsCompleted: subCount },
      })
    synced += 1
  }
  return synced
}

async function generateDailySnapshots(): Promise<number> {
  const yesterday = yesterdayStr()
  const rows = await db.select({ id: children.id }).from(children)
  let generated = 0
  for (const c of rows) {
    const report = await generateReport(c.id, 'day', { start: yesterday, end: yesterday })
    await db
      .insert(growthReportSnapshots)
      .values({
        childId: c.id,
        periodType: 'day',
        periodStart: yesterday,
        periodEnd: yesterday,
        metrics: report as never,
      })
      .onConflictDoUpdate({
        target: [growthReportSnapshots.childId, growthReportSnapshots.periodType, growthReportSnapshots.periodStart],
        set: { metrics: report as never, generatedAt: new Date() },
      })
    generated += 1
  }
  return generated
}

export async function runDailyReset() {
  const [recordsCreated, expired, calendarsSynced, snapshotsGenerated] = await Promise.all([
    ensureTodayRecords(),
    expireStoolResults(),
    syncCalendars(),
    generateDailySnapshots(),
  ])
  return { recordsCreated, expired, calendarsSynced, snapshotsGenerated }
}
