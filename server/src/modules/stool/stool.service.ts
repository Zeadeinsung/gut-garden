import { mkdirSync, writeFileSync, existsSync, createReadStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq, desc, and, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { stoolAnalyses } from '../../db/schema/index.js'
import { BRISTOL_PRESETS, ICON_TO_BRISTOL } from './stool.presets'
import { analyzeStoolPhoto } from './stool-analysis.client'
import { onStoolEvent } from '../badges/badge-hooks.js'
import { throwError } from '../../config/errors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads')

const VALID_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_SIZE = 10 * 1024 * 1024

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export interface SelectIconInput {
  child_id: number
  stool_icon_type?: string
  bristol_type?: number
}

export async function selectIcon(input: SelectIconInput) {
  const childId = Number(input.child_id)
  if (!childId) throwError('CHILD_001')

  let bristol = Number(input.bristol_type)
  if (!bristol && input.stool_icon_type) bristol = ICON_TO_BRISTOL[input.stool_icon_type] ?? 0
  if (!bristol || bristol < 1 || bristol > 7) bristol = 4

  const preset = BRISTOL_PRESETS[bristol]
  const now = new Date()
  const [row] = await db
    .insert(stoolAnalyses)
    .values({
      childId,
      mode: 'icon_selection',
      stoolIconType: input.stool_icon_type || null,
      bristolType: bristol,
      diagnosis: preset.diagnosis,
      taskSuggestion: preset.task_suggestion,
      uploadedAt: now,
      expiresAt: addDays(now, 3),
    })
    .returning()

  const badges = await onStoolEvent(childId)
  return {
    analysis_id: row.id,
    mode: 'icon_selection',
    bristol_type: bristol,
    diagnosis: preset.diagnosis,
    task_suggestion: preset.task_suggestion,
    badges_awarded: badges,
  }
}

export interface UploadFile {
  filename: string
  mimetype: string
  data: Buffer
}

export async function uploadPhoto(childId: number, file: UploadFile) {
  if (!childId) throwError('CHILD_001')
  const ext = path.extname(file.filename || '').toLowerCase()
  if (!VALID_EXT.has(ext) || !file.data || file.data.length > MAX_SIZE) throwError('STOOL_004')

  mkdirSync(UPLOAD_DIR, { recursive: true })
  const filename = `${childId}-${Date.now()}${ext}`
  const filePath = path.join(UPLOAD_DIR, filename)
  writeFileSync(filePath, file.data)

  const result = await analyzeStoolPhoto(filePath)
  if (!result.is_valid) throwError('STOOL_001')

  const now = new Date()
  const [row] = await db
    .insert(stoolAnalyses)
    .values({
      childId,
      mode: 'photo_upload',
      imageUrl: `/uploads/${filename}`,
      bristolType: result.bristol_type,
      diagnosis: result.diagnosis,
      taskSuggestion: result.task_suggestion,
      isValid: true,
      uploadedAt: now,
      expiresAt: addDays(now, 3),
    })
    .returning()

  const badges = await onStoolEvent(childId)
  return {
    analysis_id: row.id,
    mode: 'photo_upload',
    bristol_type: result.bristol_type,
    diagnosis: result.diagnosis,
    task_suggestion: result.task_suggestion,
    is_valid: true,
    image_url: row.imageUrl,
    badges_awarded: badges,
  }
}

function toDTO(row: typeof stoolAnalyses.$inferSelect) {
  return {
    analysis_id: row.id,
    mode: row.mode,
    bristol_type: row.bristolType,
    diagnosis: row.diagnosis,
    task_suggestion: row.taskSuggestion,
    image_url: row.imageUrl,
    is_valid: row.isValid,
    uploaded_at: row.uploadedAt,
    expires_at: row.expiresAt,
  }
}

export async function getAnalysis(id: number) {
  const [row] = await db.select().from(stoolAnalyses).where(eq(stoolAnalyses.id, id))
  if (!row) throwError('STOOL_002')
  return toDTO(row)
}

export async function getLatest(childId: number) {
  if (!childId) throwError('CHILD_001')
  const [row] = await db
    .select()
    .from(stoolAnalyses)
    .where(eq(stoolAnalyses.childId, childId))
    .orderBy(desc(stoolAnalyses.id))
    .limit(1)
  if (!row) throwError('STOOL_002')
  return toDTO(row)
}

/** 打卡页便便联动：最近一条未过期（3 天有效）的分析 */
export async function getRecentStool(childId: number) {
  const [row] = await db
    .select()
    .from(stoolAnalyses)
    .where(and(eq(stoolAnalyses.childId, childId), sql`${stoolAnalyses.expiresAt} >= now()`))
    .orderBy(desc(stoolAnalyses.id))
    .limit(1)
  return row ?? null
}

export function stoolFilePath(name: string): string {
  return path.join(UPLOAD_DIR, path.basename(name))
}

export function mimeOf(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return (
    {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }[ext] || 'application/octet-stream'
  )
}

export { existsSync as fileExists, createReadStream }
