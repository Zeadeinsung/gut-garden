import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBadgeStore } from '@/stores/badgeStore'
import { useGardenStore } from '@/stores/gardenStore'
import { useAuthStore } from '@/stores/authStore'
import Header from '@/components/navigation/Header'
import TopRightControls from '@/components/navigation/TopRightControls'
import type { BadgeDef, BadgeRarity } from '@/types/badges'
import { badgeIconUrl } from '@/lib/badgeIcons'
import { sfx } from '@/lib/sound'
import { UiIcon } from '@/lib/uiIcons'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import BadgeBook from '@/components/BadgeBook'

const DEFAULT_DEFS: BadgeDef[] = [
  { id: 1,  code: 'first_checkin',   name: '初来乍到',   description: '完成首次打卡',            category: 'persistence', icon_url: badgeIconUrl('first_checkin') },
  { id: 2,  code: 'persist_3d',      name: '初露锋芒',   description: '最高连续打卡3天',          category: 'persistence', icon_url: badgeIconUrl('persist_3d') },
  { id: 3,  code: 'persist_7d',      name: '一周之星',   description: '最高连续打卡7天',          category: 'persistence', icon_url: badgeIconUrl('persist_7d') },
  { id: 4,  code: 'persist_30d',     name: '月度冠军',   description: '最高连续打卡30天',         category: 'persistence', icon_url: badgeIconUrl('persist_30d') },
  { id: 5,  code: 'persist_100d',    name: '百日守护',   description: '最高连续打卡100天',        category: 'persistence', icon_url: badgeIconUrl('persist_100d') },
  { id: 6,  code: 'first_feed',      name: '初次投喂',   description: '完成首次食物投喂',        category: 'exploration', icon_url: badgeIconUrl('first_feed') },
  { id: 7,  code: 'feed_50',         name: '小小农夫',   description: '累计投喂50次',            category: 'exploration', icon_url: badgeIconUrl('feed_50') },
  { id: 8,  code: 'first_magnifier', name: '小小科学家', description: '首次使用放大镜',           category: 'exploration', icon_url: badgeIconUrl('first_magnifier') },
  { id: 9,  code: 'magnifier_20',    name: '放大镜专家', description: '累计使用放大镜20次',       category: 'exploration', icon_url: badgeIconUrl('magnifier_20') },
  { id: 10, code: 'garden_doctor',   name: '花园医生',   description: '完成10次花园恢复',         category: 'exploration', icon_url: badgeIconUrl('garden_doctor') },
  { id: 11, code: 'first_quiz',      name: '好奇宝宝',   description: '首次完成问答',            category: 'knowledge',   icon_url: badgeIconUrl('first_quiz') },
  { id: 12, code: 'quiz_10',         name: '答题小能手', description: '累计答对10题',            category: 'knowledge',   icon_url: badgeIconUrl('quiz_10') },
  { id: 13, code: 'first_stool',     name: '便便观察员', description: '首次便便记录',            category: 'knowledge',   icon_url: badgeIconUrl('first_stool') },
  { id: 14, code: 'stool_streak_7',  name: '持续观察',   description: '连续7天便便记录',          category: 'knowledge',   icon_url: badgeIconUrl('stool_streak_7') },
  { id: 15, code: 'module_fiber',    name: '纤维专家',   description: '完成膳食纤维广场模块',    category: 'knowledge',   icon_url: badgeIconUrl('module_fiber') },
  { id: 16, code: 'module_all_5',    name: '知识全能王', description: '完成全部5个知识模块',      category: 'knowledge',   icon_url: badgeIconUrl('module_all_5') },
  { id: 17, code: 'type4_streak_5',  name: '超级便便',   description: '连续5次布里斯托Type 4',   category: 'special',     icon_url: badgeIconUrl('type4_streak_5') },
  { id: 18, code: 'perfect_week',    name: '完美一周',   description: '一周7天全勤',             category: 'special',     icon_url: badgeIconUrl('perfect_week') },
  { id: 19, code: 'all_sub_7d',      name: '全能小冠军', description: '连续7天完成全部附加子项', category: 'special',     icon_url: badgeIconUrl('all_sub_7d') },
  { id: 20, code: 'birthday',        name: '花园生日',   description: '儿童生日当天登录',        category: 'special',     icon_url: badgeIconUrl('birthday') },
  { id: 21, code: 'spring_festival', name: '春节彩蛋',   description: '春节期间登录',            category: 'special',     icon_url: badgeIconUrl('spring_festival') },
]

const CATEGORY_LABELS: Record<string, string> = {
  persistence: '健康习惯徽章',
  exploration: '探索发现徽章',
  knowledge: '科普小学者徽章',
  special: '特殊挑战徽章',
}

const CAT_GRADIENTS: Record<string, string> = {
  persistence: 'bg-gradient-to-r from-[#5CB847] to-[#419D2F]',
  exploration: 'bg-gradient-to-r from-[#4A90E2] to-[#3273DC]',
  knowledge: 'bg-gradient-to-r from-[#9B51E0] to-[#7B2CBF]',
  special: 'bg-gradient-to-r from-[#F2994A] to-[#E06D12]',
}

const RARITY_RANK: Record<BadgeRarity, number> = { bronze: 1, silver: 2, gold: 3 }

const BADGE_FRAMES: Record<BadgeRarity, string> = {
  bronze: '/assets/badges/frames/ui_badge_frame_bronze.webp',
  silver: '/assets/badges/frames/ui_badge_frame_silver.webp',
  gold: '/assets/badges/frames/ui_badge_frame_gold.webp',
}

const LEVELS = [
  'Lv.1 肠道小萌芽',
  'Lv.2 花园小园丁',
  'Lv.3 菌居朋好友',
  'Lv.4 肠道小园丁',
  'Lv.5 生态守护者',
]

const GROWTH_CAP = 1000

const formatAwardDate = (d: string) => d.slice(0, 10).replace(/-/g, '.')

const CARD_SHADOW = 'shadow-[inset_0_0_15px_rgba(165,140,110,0.25),0_6px_16px_rgba(61,43,31,0.12)]'

// 可编辑画布（1280 宽）：Ctrl+E 进入编辑模式后各模块可拖动/缩放
const BADGE_DEFAULTS: Record<string, BlockPos> = {
  playerCard:    { x: 24,  y: 20,  w: 250, h: 156 },
  assistantCard: { x: 24,  y: 192, w: 250, h: 340 },
  assistantChar: { x: 113, y: 250, w: 72,  h: 72  },
  cabinet:       { x: 290, y: 20,  w: 672, h: 620 },
  growthCard:    { x: 978, y: 20,  w: 278, h: 248 },
  unlockCard:    { x: 978, y: 284, w: 278, h: 348 },
  recentCard:    { x: 140, y: 540, w: 250, h: 96 },
  badgeBook:     { x: 290, y: 660, w: 700, h: 232 },
}

export default function BadgePage() {
  const navigate = useNavigate()
  const { gardenLevel, gardenXp } = useGardenStore()
  const { defs, awarded } = useBadgeStore()
  const user = useAuthStore((s) => s.user)
  const childAvatar = user?.children.find((c) => c.id === user.active_child_id)?.avatar_url
  const shelfRefs = useRef<(HTMLDivElement | null)[]>([])
  const { editing, containerRef, pos, handleMove, handleResize, handleReset } = useEditorPage('badges', BADGE_DEFAULTS, {
    // v5 起收藏书内容放大 → 把旧存档的收藏书宽度也一并放大
    // v6 起柜内徽章放大 → 展柜加高、收藏书/最近获得卡下移
    init: (merged, version) => {
      if (version > 0 && version < 5) {
        merged = { ...merged, badgeBook: { ...merged.badgeBook, w: 700, h: 232 } }
      }
      if (version > 0 && version < 6) {
        merged = {
          ...merged,
          cabinet: { ...merged.cabinet, h: 620 },
          badgeBook: { ...merged.badgeBook, y: 660 },
          recentCard: { ...merged.recentCard, y: 540 },
        }
      }
      // v7 起“即将解锁”卡片加高（新增进度条 + 目标预览图）
      if (version > 0 && version < 7) {
        merged = {
          ...merged,
          unlockCard: { ...merged.unlockCard, h: Math.max(merged.unlockCard.h, 348) },
        }
      }
      return merged
    },
  })

  const allDefs = useMemo(() => {
    if (defs.length === 0) {
      useBadgeStore.getState().setDefs(DEFAULT_DEFS)
      return DEFAULT_DEFS
    }
    return defs
  }, [defs])

  const awardedCodes = new Set(awarded.map((a) => a.code))
  // 每个徽章按其已获得的最高稀有度（金 > 银 > 铜）显示边框
  const highestRarityByCode = useMemo(() => {
    const map: Record<string, BadgeRarity> = {}
    awarded.forEach((a) => {
      if (!map[a.code] || RARITY_RANK[a.rarity] > RARITY_RANK[map[a.code]]) {
        map[a.code] = a.rarity
      }
    })
    return map
  }, [awarded])
  const earnedCount = awarded.length
  const totalCount = allDefs.length

  // 本会话中新获得徽章 → 播放庆祝音效
  const prevAwardCount = useRef(earnedCount)
  useEffect(() => {
    if (earnedCount > prevAwardCount.current) sfx.celebrate()
    prevAwardCount.current = earnedCount
  }, [earnedCount])

  const grouped = useMemo(() => {
    const map: Record<string, BadgeDef[]> = {}
    allDefs.forEach((d) => {
      if (!map[d.category]) map[d.category] = []
      map[d.category].push(d)
    })
    return map
  }, [allDefs])

  // 注意：shelves 必须是稳定引用，不能直接 Object.entries(grouped)，
  // 否则每次渲染都是新数组，下方 useEffect 依赖 [shelves] 会每帧重跑 → setState → 无限渲染循环
  const shelves = useMemo(() => Object.entries(grouped), [grouped])
  // “神秘花园区域”解锁目标：集齐 5 枚徽章后开启
  const UNLOCK_TARGET = 5
  const unlockRemain = Math.max(0, UNLOCK_TARGET - earnedCount)
  const unlockPct = Math.min(100, Math.round((earnedCount / UNLOCK_TARGET) * 100))

  // 各层架是否横向溢出（决定是否显示 "❯" 滑动箭头）
  const [scrollableRows, setScrollableRows] = useState<boolean[]>([])
  const [scrolledRows, setScrolledRows] = useState<boolean[]>([])
  useEffect(() => {
    const measure = () => {
      const next = shelves.map((_, i) => {
        const el = shelfRefs.current[i]
        return !!el && el.scrollWidth > el.clientWidth
      })
      setScrollableRows((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next
      )
    }
    measure()
    const obs = new ResizeObserver(measure)
    shelfRefs.current.forEach((el) => { if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [shelves])

  const growthValue = gardenXp % GROWTH_CAP
  const growthPct = Math.min(100, Math.round((growthValue / GROWTH_CAP) * 100))
  const growthRemain = Math.max(0, GROWTH_CAP - growthValue)

  const levelIndex = Math.max(0, Math.min(gardenLevel - 1, LEVELS.length - 1))
  const levelName = LEVELS[levelIndex]

  const lastAward = awarded.length > 0 ? awarded[awarded.length - 1] : null
  const lastAwardDef = lastAward ? allDefs.find((d) => d.code === lastAward.code) : null
  const lastAwardIcon = lastAward ? (lastAwardDef?.icon_url || badgeIconUrl(lastAward.code)) : ''

  return (
    <div className="flex flex-col min-h-full">
      <Header
        leftSlot={
          <button
            className="w-9 h-9 rounded-full bg-[rgba(92,64,43,0.7)] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
            onClick={() => navigate('/')}
            title="返回"
          >
            <UiIcon name="chevronLeft" size={18} />
          </button>
        }
        centerSlot={
          <div className="text-center w-full translate-x-[57px] translate-y-[70px]">
            <h1 className="text-[29px] font-black text-[#3D2B1F] flex items-center justify-center gap-2 tracking-wide leading-none">
              成长徽章馆
            </h1>
            <p className="text-[10px] text-[#7C6A59] mt-1">每一枚徽章，都是你照顾花园的证明</p>
          </div>
        }
        rightSlot={
          <div className="flex items-center gap-2">
            <TopRightControls />
            {editing && (
              <button
                className="bg-garden-coral/90 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-garden-coral transition-colors"
                onClick={handleReset}
              >
                重置布局
              </button>
            )}
            <button className="bg-white/45 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-[#3D2B1F] inline-flex items-center gap-1.5 shadow-[0_2px_6px_rgba(61,43,31,0.08)] border border-white/80 hover:bg-white/70 transition-colors">
              <UiIcon name="book" size={13} />
              徽章说明
            </button>
          </div>
        }
      />

      {/* 可编辑画布：Ctrl+E 进入编辑模式，各模块可拖动/缩放 */}
      <div className="flex-1 px-4 pb-4 pt-1">
        <div ref={containerRef} className="relative mx-auto w-full max-w-[1280px] h-[920px]">
          {/* 左栏：玩家等级 + 助手 */}
          <DraggableBlock blockId="playerCard" defaultPos={pos('playerCard')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <div className="relative w-full h-full rounded-[18px] border-[1.5px] border-[#E2D4B9] bg-[linear-gradient(to_bottom,#FFFDF7_0%,#F5ECD7_100%)] shadow-[0_8px_16px_rgba(100,70,40,0.08)] flex items-center pl-[68px] pr-3 py-3">
              {/* 破框头像：层级高于底板，向左/向上溢出卡片边缘 */}
              <div className="absolute left-[-20px] top-[calc(50%+10px)] -translate-y-[40%] z-[2] w-[88px] h-[88px] rounded-full bg-[radial-gradient(circle_at_center,#FFFDF7_30%,#E5D9C5_100%)] border-[3px] border-[#D4B872] shadow-[0_0_0_2px_#FFFFFF,inset_0_3px_8px_rgba(90,65,40,0.3),0_3px_6px_rgba(90,65,40,0.2)] flex items-center justify-center overflow-hidden">
                <img
                  src={childAvatar || '/assets/ui/ui_avatar_default_child.webp'}
                  alt="用户头像"
                  className="w-[72px] h-[72px] rounded-full object-cover"
                />
                {/* 10点钟方向的小幼苗 */}
                <div className="absolute -top-[5px] -left-[4px] flex items-center justify-center drop-shadow-sm">
                  <UiIcon name="sprout" size={15} className="rotate-[-20deg]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[21px] font-extrabold text-[#3D2D1E] flex items-center gap-1 leading-tight whitespace-nowrap -ml-[5px]">
                  <span className="truncate">{levelName}</span>
                  <UiIcon name="leaf" size={14} className="shrink-0" />
                </div>
                <div className="text-[11px] text-[#8A7B6B] font-semibold mt-1.5 flex justify-center items-center gap-1">
                  <span>成长值</span>
                  <span className="text-[#3D2D1E] font-bold">{growthValue} / {GROWTH_CAP}</span>
                </div>
                <div className="h-[10px] bg-[#EADEC7] rounded-full overflow-hidden shadow-[inset_0_2px_3px_rgba(0,0,0,0.1)]">
                  <div
                    className="h-full bg-gradient-to-r from-[#8BD646] to-[#4CAF50] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                    style={{ width: `${growthPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#8A7B6B] mt-1.5 text-center">距离下一级还差 {growthRemain} 成长值</p>
              </div>
            </div>
          </DraggableBlock>

          <DraggableBlock blockId="assistantCard" defaultPos={pos('assistantCard')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <div className={`rounded-[22px] border-[5px] border-[#C07858]/50 bg-[radial-gradient(ellipse_at_center,#FFF3D4_25%,#D9BC7C_100%)] p-3.5 w-full h-full flex flex-col shadow-[inset_0_0_16px_rgba(180,145,95,0.3),0_6px_16px_rgba(61,43,31,0.12)]`}>
              <div className="text-center text-[#5D4037] text-[15px] font-black pb-2 border-b border-[#C07858]/50 [text-shadow:0_1px_0_rgba(255,255,255,0.8)]">菌小园助手</div>
              <div className="flex flex-col items-center mt-2.5">
                <div className="relative mt-[141px] bg-[#FBF5E6] rounded-[14px] px-3 py-3 text-[12px] text-[#4A3628] leading-[1.5] shadow-[0_3px_8px_rgba(110,80,50,0.08)] border-[1.5px] border-[#DFCFA9]">
                  <div className="absolute -top-[8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[8px] border-b-[#DFCFA9]" />
                  <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[7px] border-b-[#FBF5E6]" />
                  哇！你已经收集了 <strong className="text-[#42A821]">{earnedCount}枚徽章</strong> 啦！
                  <br /><br />
                  再接再厉，解锁更多 <strong className="text-[#42A821]">神秘徽章</strong> 吧！
                </div>
              </div>
            </div>
          </DraggableBlock>

          {/* 独立助手形象：无圆框，可直接拖动/缩放 */}
          <DraggableBlock blockId="assistantChar" defaultPos={pos('assistantChar')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize} zIndex={15}>
            <img
              src="/assets/characters/png/char_xiaoyuan.webp"
              alt="菌小园助手"
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_4px_8px_rgba(90,65,40,0.35)]"
            />
          </DraggableBlock>

          {/* 中央木质展柜 */}
          <DraggableBlock blockId="cabinet" defaultPos={pos('cabinet')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <div
              className="relative w-full h-full rounded-[20px] overflow-hidden bg-[url('/assets/ui/ui_badge_cabinet.webp')] bg-[length:100%_100%] shadow-[0_6px_16px_rgba(85,60,35,0.12)]"
            >
            {shelves.map(([cat, items], idx) => {
              return (
                <div
                  key={cat}
                  className="absolute left-[4%] right-[4%] flex items-center"
                  style={{ top: `${[25, 42.5, 59.5, 78][idx]}%` }}
                >
                  <div
                    className={`absolute -top-3 left-0 z-[5] rounded-full text-white text-[12px] font-extrabold px-2.5 py-0.5 inline-flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.25)] ${CAT_GRADIENTS[cat] || 'bg-[#999]'}`}
                  >
                    <span className="w-[16px] h-[16px] rounded-full bg-white/30 inline-flex items-center justify-center text-[10px] leading-none">{idx + 1}</span>
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  <div
                    ref={(el) => { shelfRefs.current[idx] = el }}
                    className="flex-1 flex items-center gap-2.5 overflow-x-auto min-h-0 py-1 pl-[96px] pr-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    onScroll={(e) => {
                      const el = e.currentTarget
                      setScrolledRows((prev) => {
                        const next = [...prev]
                        const flag = el.scrollLeft > 4
                        if (next[idx] === flag) return prev
                        next[idx] = flag
                        return next
                      })
                    }}
                  >
                    {items.map((def) => {
                      const earned = awardedCodes.has(def.code)
                      return (
                        <div key={def.code} className="group flex flex-col items-center shrink-0 w-[88px] transition-transform duration-200 hover:-translate-y-1">
                          <div className="relative w-[66px] h-[66px] rounded-full flex items-center justify-center">
                            {/* 徽章本体填满气泡 */}
                            <img
                              src={def.icon_url}
                              alt={def.name}
                              className={`w-full h-full object-cover rounded-full ${earned ? 'saturate-[1.15] contrast-[1.1]' : 'grayscale opacity-80'}`}
                            />
                            {/* 玻璃气泡质感 */}
                            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                              {/* 左上高光 + 玻璃泛光（压低白色增强徽章对比度） */}
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0)_100%)]" />
                              {/* 内边缘高光形成球面 */}
                              <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),inset_0_-4px_8px_rgba(255,255,255,0.1),inset_1px_0_3px_rgba(255,255,255,0.1),inset_-1px_0_3px_rgba(255,255,255,0.04),0_3px_7px_rgba(0,0,0,0.3)]" />
                              {/* 左上镜面反光 */}
                              <div className="absolute top-[5px] left-[7px] w-[15px] h-[9px] rounded-full bg-white/50 blur-[1.5px] rotate-[-24deg]" />
                              {/* 右下小反光 */}
                              <div className="absolute bottom-[8px] right-[9px] w-[6px] h-[6px] rounded-full bg-white/20 blur-[1px]" />
                              {/* 悬停滑过的高光 */}
                              <div className="absolute -left-1/2 top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] transition-all duration-700 group-hover:left-[130%]" />
                            </div>
                            {/* 金银铜边框 */}
                            {earned && highestRarityByCode[def.code] && (
                              <img
                                src={BADGE_FRAMES[highestRarityByCode[def.code]]}
                                alt=""
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] object-contain pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
                              />
                            )}
                          </div>
                          <p className="text-[12px] font-extrabold text-white mt-1.5 text-center leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]">
                            {def.name}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  {scrolledRows[idx] && (
                    <button
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-[6] w-[30px] h-[30px] rounded-full bg-white/85 text-[#3D2B1F] flex items-center justify-center text-base font-black shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:scale-110 hover:bg-white transition-transform"
                      onClick={() => shelfRefs.current[idx]?.scrollBy({ left: -220, behavior: 'smooth' })}
                      title="返回"
                    >
                      ❮
                    </button>
                  )}
                  {scrollableRows[idx] && (
                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-[6] w-[30px] h-[30px] rounded-full bg-white/85 text-[#3D2B1F] flex items-center justify-center text-base font-black shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:scale-110 hover:bg-white transition-transform"
                      onClick={() => shelfRefs.current[idx]?.scrollBy({ left: 220, behavior: 'smooth' })}
                      title="更多徽章"
                    >
                      ❯
                    </button>
                  )}
                </div>
              )
            })}
            </div>
          </DraggableBlock>

          {/* 右栏：成长之路 + 即将解锁 */}
          <DraggableBlock blockId="growthCard" defaultPos={pos('growthCard')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <div className={`rounded-[22px] border-[5px] border-[#C07858]/50 bg-[radial-gradient(ellipse_at_center,#FFF8E7_30%,#DCC59A_100%)] p-3.5 w-full h-full ${CARD_SHADOW}`}>
              <div className="text-[14px] font-extrabold text-[#334A2A] mb-2.5">成长之路</div>
              <div className="relative pl-7">
                {/* 左侧贯穿绿线 */}
                <div className="absolute left-[12px] top-[12px] bottom-[12px] w-[2px] bg-[#A2D094] z-[1]" />
                <div className="flex flex-col">
                  {LEVELS.map((lv, i) => {
                    const isDone = i < levelIndex
                    const isCurrent = i === levelIndex
                    return (
                      <div
                        key={lv}
                        className={`relative flex justify-between items-center text-[13px] px-3 py-1 mb-1.5 rounded-[10px] transition-colors ${
                          isCurrent
                            ? 'bg-[#DDEFD4] text-[#2C6B25] font-bold'
                            : isDone
                              ? 'text-[#5A6B4C]'
                              : 'text-[#B0A898]'
                        }`}
                      >
                        {/* 节点圆点 */}
                        <div className={`absolute left-[-19px] top-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full border-2 border-white z-[2] ${
                          isCurrent
                            ? 'bg-[#2C6B25] shadow-[0_0_0_2px_#A2D094]'
                            : isDone
                              ? 'bg-[#62B855]'
                              : 'bg-[#C4BDAF]'
                        }`} />
                        <span className="whitespace-nowrap">{lv}</span>
                        <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[12px]">
                          {isDone ? '✔' : isCurrent ? '●' : '🔒'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </DraggableBlock>

          <DraggableBlock blockId="unlockCard" defaultPos={pos('unlockCard')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <div className={`rounded-[22px] border-[5px] border-[#C07858]/50 bg-[radial-gradient(ellipse_at_center,#FFF8E7_30%,#DCC59A_100%)] p-3.5 w-full h-full flex flex-col items-center justify-between text-center ${CARD_SHADOW}`}>
              {/* A. 模块标题 */}
              <div className="w-full text-left">
                <div className="text-[14px] font-extrabold text-[#3D2B1F]">即将解锁</div>
              </div>

              {/* B. 未知徽章图标：藤蔓木质外环 + 深灰星空底 + 白色问号 */}
              <div className="relative w-[62px] h-[62px] shrink-0">
                <div className="absolute inset-0 rounded-full p-[3px] bg-[conic-gradient(from_40deg,#5E8C34,#8A6B3F,#4C7A28,#6B8F3E,#A07840,#5E8C34)] shadow-[0_3px_8px_rgba(50,35,20,0.3),inset_0_1px_2px_rgba(255,255,255,0.35)]">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-[radial-gradient(circle_at_35%_28%,#5C5C5C_0%,#2E2E2E_55%,#171717_100%)] shadow-[inset_0_3px_6px_rgba(0,0,0,0.65),inset_0_-1px_2px_rgba(255,255,255,0.06)] flex items-center justify-center">
                    {/* 星空颗粒纹理 */}
                    <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.5)_0%,transparent_10%),radial-gradient(circle_at_68%_30%,rgba(255,255,255,0.35)_0%,transparent_9%),radial-gradient(circle_at_40%_72%,rgba(255,255,255,0.4)_0%,transparent_10%),radial-gradient(circle_at_82%_66%,rgba(255,255,255,0.3)_0%,transparent_8%),radial-gradient(circle_at_52%_48%,rgba(255,255,255,0.25)_0%,transparent_7%)]" />
                    {/* 大问号 */}
                    <span className="relative text-white text-[30px] font-black leading-none [text-shadow:0_2px_4px_rgba(0,0,0,0.6)]">?</span>
                  </div>
                </div>
                {/* 外环点缀绿叶 */}
                <UiIcon name="leaf" size={15} className="absolute -top-[4px] -left-[6px] rotate-[-25deg] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
                <UiIcon name="leaf" size={12} className="absolute -top-[2px] -right-[5px] rotate-[35deg] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
                <UiIcon name="leaf" size={12} className="absolute -bottom-[3px] -left-[2px] rotate-[20deg] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" />
              </div>

              {/* C. 进度提示区 */}
              <div className="w-full">
                <p className="text-[11px] text-[#5D4037] font-semibold">还差 <strong className="text-[#2C6B25]">{unlockRemain}</strong> 枚徽章</p>
                <div className="mt-1.5 h-[8px] rounded-full bg-[#E7EFD9]/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9BE64B] to-[#3FBE2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-500"
                    style={{ width: `${unlockPct}%` }}
                  />
                </div>
              </div>

              {/* D. 解锁目标描述 */}
              <p className="text-[11px] text-[#5D4037] font-bold leading-snug">
                即可解锁 <strong className="text-[#E0395E]">神秘花园区域</strong>
              </p>

              {/* E. 目标预览图 */}
              <div className="relative flex items-center justify-center">
                {/* 后方天蓝色晕开光晕：明显大于蘑菇屋，向四周柔柔散开 */}
                <div className="absolute w-[128px] h-[128px] rounded-full bg-[radial-gradient(circle,rgba(135,206,235,0.62)_0%,rgba(135,206,235,0.3)_45%,transparent_76%)]" />
                <img
                  src="/assets/ui/ui_reward_house.webp"
                  alt="神秘花园区域预览"
                  className="relative w-[80px] h-[80px] object-contain drop-shadow-[0_5px_10px_rgba(90,60,40,0.28)]"
                />
              </div>

              {/* F. 行动按钮 */}
              <button
                className="w-full py-2.5 rounded-full bg-gradient-to-b from-[#81E44F] via-[#4EB72B] to-[#399C1A] text-white text-[14px] font-black shadow-[0_4px_0_#2A7813,0_6px_12px_rgba(42,120,19,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] tracking-wide hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_#2A7813,0_2px_4px_rgba(42,120,19,0.3)] transition-all"
                onClick={() => navigate('/garden')}
              >
                去探索
              </button>
            </div>
          </DraggableBlock>

          {/* 左下角：最近获得浮动卡片（深木铭牌 + 金币金框徽章） */}
          {lastAward && (
            <DraggableBlock blockId="recentCard" defaultPos={pos('recentCard')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize} zIndex={20}>
              <div className="relative w-full h-full">
                {/* 铭牌标题：咬合在卡片左上角（同菌小园助手锈棕描边色） */}
                <div className="absolute -top-[7px] left-[10px] z-[3] bg-gradient-to-b from-[#C07858] to-[#9A5638] text-[#FFF3D4] text-[11px] font-bold px-2.5 py-[3px] rounded-tl-[6px] rounded-bl-[6px] shadow-[1px_1px_0_#7A3F22,2px_2px_4px_rgba(0,0,0,0.25)] leading-none">
                  最近获得
                </div>
                {/* 左下角破框叶子 */}
                <UiIcon name="leaf" size={15} className="absolute -bottom-[5px] -left-[3px] z-[2] drop-shadow-sm rotate-[-25deg]" />
                <UiIcon name="leaf" size={12} className="absolute -bottom-[2px] left-[11px] z-[2] drop-shadow-sm rotate-[15deg]" />

                {/* 金色渐变底板（同菌小园助手配色） */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#FFF3D4_25%,#D9BC7C_100%)] border-[3px] border-[#C07858]/50 rounded-[20px] shadow-[inset_0_0_16px_rgba(180,145,95,0.3),0_6px_16px_rgba(61,43,31,0.12)] flex items-center gap-2.5 px-3 pt-4 pb-2.5">
                  {/* 金币齿轮金框徽章 + 45° NEW */}
                  <div className="relative w-[52px] h-[52px] shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFFFFF_20%,#FFE896_65%,#F4C442_100%)_padding-box,linear-gradient(135deg,#FFF6D1_0%,#FFD700_45%,#D49400_100%)_border-box] border-[3px] border-transparent shadow-[0_3px_6px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(180,120,0,0.4)] flex items-center justify-center">
                    <img src={lastAwardIcon} alt={lastAward.name} className="w-[68%] h-[68%] object-contain" />
                    <div className="absolute -top-[6px] -left-[8px] bg-[#FF5252] text-white text-[9px] font-bold px-1 py-px rounded-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.3)] -rotate-45">NEW</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-[#42A821] truncate leading-tight">{lastAward.name}</div>
                    <div className="text-[11px] text-[#6A5544] leading-snug mt-0.5 line-clamp-1">{lastAwardDef?.description}</div>
                    <div className="text-[11px] font-bold text-[#42A821] mt-0.5">奖励 🌱 成长值 +50</div>
                    <div className="text-[10px] text-[#8A7B6B] mt-0.5 text-right whitespace-nowrap">{formatAwardDate(lastAward.awarded_at)} 获得</div>
                  </div>
                </div>
              </div>
            </DraggableBlock>
          )}

          {/* 底部中央：徽章收藏书（可翻页） */}
          <DraggableBlock blockId="badgeBook" defaultPos={pos('badgeBook')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <div className="w-full h-full">
              <BadgeBook defs={allDefs} awardedCodes={awardedCodes} awardedRarities={highestRarityByCode} />
            </div>
          </DraggableBlock>
        </div>
      </div>
    </div>
  )
}
