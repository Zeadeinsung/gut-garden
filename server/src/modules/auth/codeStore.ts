import { throwError } from '../../config/errors.js'

const CODES = new Map<string, { code: string; sentAt: number }>()
const THROTTLE_MS = 60_000
const EXPIRE_MS = 5 * 60_000

export function sendLoginCode(phone: string): string {
  const existing = CODES.get(phone)
  if (existing && Date.now() - existing.sentAt < THROTTLE_MS) {
    throwError('AUTH_002')
  }
  const code = String(Math.floor(100000 + Math.random() * 900000))
  CODES.set(phone, { code, sentAt: Date.now() })
  console.log(`[sms-mock] 验证码 ${phone} → ${code}`)
  return code
}

export function verifyLoginCode(phone: string, code: string): void {
  const entry = CODES.get(phone)
  if (!entry || entry.code !== code || Date.now() - entry.sentAt > EXPIRE_MS) {
    throwError('AUTH_001')
  }
  CODES.delete(phone)
}
