export type BadgeRarity = 'bronze' | 'silver' | 'gold'
export type BadgeCategory = 'persistence' | 'exploration' | 'knowledge' | 'special'

export interface BadgeDef {
  id: number
  code: string
  name: string
  description: string
  category: BadgeCategory
  icon_url: string
}

export interface BadgeAward {
  id: number
  badge_id: number
  code: string
  name: string
  rarity: BadgeRarity
  awarded_at: string
}
