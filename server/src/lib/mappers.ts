import type { children } from '../db/schema/index.js'

export type ChildRow = typeof children.$inferSelect

export interface ChildProfile {
  id: number
  name: string
  age: number
  avatar_url: string | null
}

export function toChildProfile(row: ChildRow): ChildProfile {
  return { id: row.id, name: row.nickname, age: row.age, avatar_url: row.avatarUrl }
}

export interface UserData {
  parent_id: number
  phone: string
  children: ChildProfile[]
  active_child_id: number | null
}
