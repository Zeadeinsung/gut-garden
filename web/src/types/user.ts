export type ReadingLevel = 'child' | 'parent'

export interface ChildProfile {
  id: number
  name: string
  age: number
  avatar_url: string | null
}

export interface UserData {
  parent_id: number
  phone: string
  children: ChildProfile[]
  active_child_id: number | null
}
