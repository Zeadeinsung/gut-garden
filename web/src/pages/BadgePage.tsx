import { useMemo } from 'react'
import { useBadgeStore } from '@/stores/badgeStore'
import { useGardenStore } from '@/stores/gardenStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { BadgeDef, BadgeRarity } from '@/types/badges'

const DEFAULT_DEFS: BadgeDef[] = [
  { id: 1, code: 'first_checkin', name: '第一次打卡', description: '完成第一次每日打卡', category: 'persistence', icon_url: '' },
  { id: 2, code: 'streak_3', name: '三天坚持', description: '连续打卡3天', category: 'persistence', icon_url: '' },
  { id: 3, code: 'streak_7', name: '一周达人', description: '连续打卡7天', category: 'persistence', icon_url: '' },
  { id: 4, code: 'streak_30', name: '月度之星', description: '连续打卡30天', category: 'persistence', icon_url: '' },
  { id: 5, code: 'first_feed', name: '初次喂食', description: '第一次喂食花园', category: 'exploration', icon_url: '' },
  { id: 6, code: 'feed_10', name: '小园丁', description: '喂食10次', category: 'exploration', icon_url: '' },
  { id: 7, code: 'all_healthy', name: '健康达人', description: '保持花园健康7天', category: 'exploration', icon_url: '' },
  { id: 8, code: 'first_quiz', name: '学霸初成', description: '完成第一次课堂测验', category: 'knowledge', icon_url: '' },
  { id: 9, code: 'quiz_perfect', name: '满分达人', description: '课堂测验满分', category: 'knowledge', icon_url: '' },
  { id: 10, code: 'first_stool', name: '便便观察员', description: '第一次记录便便', category: 'special', icon_url: '' },
  { id: 11, code: 'garden_lv3', name: '花园升级', description: '花园达到3级', category: 'exploration', icon_url: '' },
  { id: 12, code: 'all_badges', name: '大满贯', description: '收集所有徽章', category: 'special', icon_url: '' },
]

const CATEGORY_LABELS: Record<string, string> = {
  persistence: '坚持',
  exploration: '探索',
  knowledge: '知识',
  special: '特殊',
}

const RARITY_COLORS: Record<BadgeRarity, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-300 to-yellow-600',
}

function getRarity(def: BadgeDef): BadgeRarity {
  if (def.code === 'all_badges') return 'gold'
  if (def.code.includes('30') || def.code.includes('perfect')) return 'gold'
  if (def.code.includes('7') || def.code.includes('10') || def.code.includes('lv3')) return 'silver'
  return 'bronze'
}

export default function BadgePage() {
  const { gardenLevel, gardenXp } = useGardenStore()
  const { streak } = useCheckinStore()
  const { defs, awarded } = useBadgeStore()

  // Init default defs if store is empty
  const allDefs = useMemo(() => {
    if (defs.length === 0) {
      useBadgeStore.getState().setDefs(DEFAULT_DEFS)
      return DEFAULT_DEFS
    }
    return defs
  }, [defs])

  const awardedCodes = new Set(awarded.map((a) => a.code))
  const earnedCount = awarded.length
  const totalCount = allDefs.length

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, BadgeDef[]> = {}
    allDefs.forEach((d) => {
      if (!map[d.category]) map[d.category] = []
      map[d.category].push(d)
    })
    return map
  }, [allDefs])

  return (
    <div className="flex flex-col h-full pb-20 px-4">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-garden-forest">成长徽章</h1>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-400">
          <span>🌱 Lv.{gardenLevel}</span>
          <span>🏅 {earnedCount}/{totalCount}</span>
          <span>🔥 {streak}天</span>
        </div>
        <div className="mt-3 mx-auto max-w-xs">
          <ProgressBar value={earnedCount} max={totalCount} color="bg-garden-gold" />
        </div>
      </div>

      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {items.map((def) => {
                const earned = awardedCodes.has(def.code)
                const rarity = getRarity(def)
                return (
                  <div
                    key={def.code}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
                      earned
                        ? 'bg-white shadow-md hover:scale-105'
                        : 'bg-gray-100/50 opacity-40'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 ${
                        earned
                          ? `bg-gradient-to-br ${RARITY_COLORS[rarity]} text-white`
                          : 'bg-gray-200 text-gray-300'
                      }`}
                    >
                      {earned ? '⭐' : '🔒'}
                    </div>
                    <p className={`text-[10px] font-medium text-center leading-tight ${
                      earned ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      {def.name}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
