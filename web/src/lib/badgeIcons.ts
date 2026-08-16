import type { BadgeCategory } from '@/types/badges'

const CODE_TO_ICON: Record<string, string> = {
  first_checkin: '/assets/badges/icons/badge_first_checkin_icon.png',
  persist_3d: '/assets/badges/icons/badge_persist_3d_icon.png',
  persist_7d: '/assets/badges/icons/badge_persist_7d_icon.png',
  persist_30d: '/assets/badges/icons/badge_persist_30d_icon.png',
  persist_100d: '/assets/badges/icons/badge_persist_100d_icon.png',
  first_feed: '/assets/badges/icons/badge_first_feed_icon.png',
  feed_50: '/assets/badges/icons/badge_feed_50_icon.png',
  first_magnifier: '/assets/badges/icons/badge_first_magnifier_icon.png',
  magnifier_20: '/assets/badges/icons/badge_magnifier_20_icon.png',
  garden_doctor: '/assets/badges/icons/badge_garden_doctor_icon.png',
  first_quiz: '/assets/badges/icons/badge_first_quiz_icon.png',
  quiz_10: '/assets/badges/icons/badge_quiz_10_icon.png',
  first_stool: '/assets/badges/icons/badge_first_stool_icon.png',
  stool_streak_7: '/assets/badges/icons/badge_stool_streak_7_icon.png',
  type4_streak_5: '/assets/badges/icons/badge_type4_streak_5_icon.png',
  perfect_week: '/assets/badges/icons/badge_perfect_week_icon.png',
  all_sub_7d: '/assets/badges/icons/badge_all_sub_7d_icon.png',
  module_fiber: '/assets/badges/icons/badge_module_fiber_icon.png',
  module_all_5: '/assets/badges/icons/badge_module_all_5_icon.png',
  birthday: '/assets/badges/icons/badge_birthday_icon.png',
  spring_festival: '/assets/badges/icons/badge_spring_festival_icon.png',
}

const FALLBACK_ICON = '/assets/badges/icons/badge_first_checkin_icon.png'

const CATEGORY_ALIASES: Record<string, BadgeCategory> = {
  persist: 'persistence',
  explore: 'exploration',
  learn: 'knowledge',
  special: 'special',
}

export function badgeIconUrl(code: string): string {
  return CODE_TO_ICON[code] || FALLBACK_ICON
}

export function normalizeBadgeCategory(cat: string | undefined): BadgeCategory {
  const aliased = cat ? CATEGORY_ALIASES[cat] : undefined
  if (aliased) return aliased
  if (cat === 'persistence' || cat === 'exploration' || cat === 'knowledge' || cat === 'special') return cat
  return 'special'
}
