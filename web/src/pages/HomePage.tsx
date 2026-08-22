import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCheckinStore } from '@/stores/checkinStore'
import { useGardenStore } from '@/stores/gardenStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import Header from '@/components/navigation/Header'
import { UiIcon } from '@/lib/uiIcons'
import { sfx } from '@/lib/sound'

const STAGE_NAMES = ['幼苗期', '成长期', '繁荣期', '茂盛期', '丰收期', '守护期']
const STAGE_ICONS = ['sprout', 'leaf', 'flower', 'tree', 'wheat', 'trophy']

const KINGKONGS = [
  { id: 'kingkong1', path: '/garden', label: '探索花园', icon: 'leaf', desc: '照顾小居民\n让花园更繁荣', borderColor: '#4CAF50', titleColor: '#2E7D32', borderAlpha: 0.55, fill: 'linear-gradient(180deg,#E8F5E8,#C8E6C9)', img: '/assets/ui/ui_kingkong_garden.webp' },
  { id: 'kingkong2', path: '/checkin', label: '每日打卡', icon: 'checkCircle', desc: '完成健康任务\n培养好习惯', borderColor: '#FF9800', titleColor: '#D84315', borderAlpha: 0.55, fill: 'linear-gradient(180deg,#FFF3E0,#FFE0B2)', img: '/assets/ui/ui_kingkong_checkin.webp' },
  { id: 'kingkong3', path: '/classroom', label: '知识课堂', icon: 'book', desc: '有趣的肠道知识\n边玩边学', borderColor: '#2196F3', titleColor: '#1976D2', borderAlpha: 0.55, fill: 'linear-gradient(180deg,#E3F2FD,#BBDEFB)', img: '/assets/ui/ui_kingkong_class.webp' },
  { id: 'kingkong4', path: '/badges', label: '成长徽章', icon: 'trophy', desc: '解锁成就徽章\n见证成长', borderColor: '#9B6AB3', titleColor: '#7B1FA2', borderAlpha: 0.55, fill: 'linear-gradient(180deg,#F3E5F5,#E1BEE7)', img: '/assets/ui/ui_kingkong_badges.webp' },
]

const AI_QUESTIONS = ['今天吃了什么？', '便便颜色正常吗？', '如何改善便秘？']

// 金刚区卡片屋子轮廓：SVG 平滑贝塞尔曲线（圆润拱顶 + 直壁屋身 + 圆底角）
// objectBoundingBox 坐标系（0~1），随卡片尺寸缩放
const HOUSE_PATH = 'M 0.5,0 C 0.46,0.012 0.40,0.03 0.32,0.06 C 0.22,0.095 0.012,0.15 0.012,0.20 L 0.012,0.86 C 0.012,0.90 0.02,0.92 0.035,0.94 L 0.965,0.94 C 0.98,0.92 0.988,0.90 0.988,0.86 L 0.988,0.20 C 0.988,0.15 0.78,0.095 0.68,0.06 C 0.60,0.03 0.54,0.012 0.5,0 Z'
const HOUSE_CLIP = 'url(#kk-house)'

const hexToRgba = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// 描边用浅色调：混合 62% 白色，降低饱和度/深度
const softBorder = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const w = 0.62
  return `rgba(${Math.round(r + (255 - r) * w)}, ${Math.round(g + (255 - g) * w)}, ${Math.round(b + (255 - b) * w)}, ${a})`
}

// Canvas is 1280 wide; content scrolls vertically as needed.
const HOME_DEFAULTS: Record<string, BlockPos> = {
  userInfo:     { x: 16,  y: 16,  w: 264, h: 128 },
  gardenStatus: { x: 16,  y: 156, w: 264, h: 212 },
  tipCard:      { x: 16,  y: 378, w: 264, h: 96 },
  welcomeBanner:{ x: 300, y: 32,  w: 380, h: 70 },
  mascot:       { x: 300, y: 86,  w: 380, h: 180 },
  heroCTA:      { x: 422, y: 282, w: 140, h: 140 },
  kingkong1:    { x: 300, y: 448, w: 174, h: 230 },
  kingkong2:    { x: 486, y: 448, w: 174, h: 230 },
  kingkong3:    { x: 672, y: 448, w: 174, h: 230 },
  kingkong4:    { x: 858, y: 448, w: 174, h: 230 },
  badgePanel:   { x: 346, y: 688, w: 640, h: 100 },
  aiPanel:      { x: 1032, y: 16, w: 248, h: 500 },
}

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

export default function HomePage() {
  const navigate = useNavigate()
  const setStoolModalOpen = useUIStore((s) => s.setStoolModalOpen)
  const setAiChatOpen = useUIStore((s) => s.setAiChatOpen)
  const { user } = useAuthStore()
  const { today, streak } = useCheckinStore()
  const { gardenLevel, moistureLevel, currentState, interactionCount, stageLabel } = useGardenStore()

  const { editing, containerRef, pos, handleMove, handleResize, handleReset } = useEditorPage('home', HOME_DEFAULTS, {
    init: (merged) => {
      const ref = merged.kingkong1 || HOME_DEFAULTS.kingkong1
      return {
        ...merged,
        kingkong2: { ...merged.kingkong2, w: ref.w, h: ref.h },
        kingkong3: { ...merged.kingkong3, w: ref.w, h: ref.h },
        kingkong4: { ...merged.kingkong4, w: ref.w, h: ref.h },
      }
    },
  })

  const childName = user?.children.find((c) => c.id === user.active_child_id)?.name ?? '宝宝'
  const childAvatar = user?.children.find((c) => c.id === user.active_child_id)?.avatar_url
  const stageIndex = clamp((gardenLevel || 1) - 1, 0, STAGE_NAMES.length - 1)

  const todayKey = getTodayKey()
  const doneCount =
    today && today.date === todayKey
      ? today.tasks.filter((t) => t.status === 'done' || t.status === 'makeup').length
      : 0

  const healthScore = clamp(Math.round((moistureLevel || 0) * 0.55 + 40), 0, 100)
  const statusRows = [
    { icon: 'dropletLine', label: '水分', value: moistureLevel >= 60 ? '充足' : moistureLevel >= 30 ? '一般' : '不足', color: 'text-sky-500' },
    { icon: 'saladLine', label: '营养', value: gardenLevel >= 3 ? '均衡' : '待补充', color: 'text-green-600' },
    { icon: 'heartLine', label: '活力', value: currentState === 'dry' || currentState === 'high_sugar' ? '需关注' : '活跃', color: 'text-rose-500' },
  ]

  return (
    <div className="flex flex-col h-full relative gg-card-border-055">

      <Header
        leftSlot={
          <div className="flex items-center gap-2">
            <img src="/assets/ui/ui_logo.webp" alt="Gut Garden 肠道花园" className="h-[54px] object-contain -ml-[30px]" />
          </div>
        }
      />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium flex items-center justify-center gap-3">
          <span>Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit</span>
          <button
            className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[11px] transition-colors"
            onClick={handleReset}
          >
            Reset All
          </button>
        </div>
      )}

      {/* Absolute positioning context */}
      <div ref={containerRef} className="flex-1 relative min-h-0">

        {/* Left column — user info */}
        <DraggableBlock
          blockId="userInfo" defaultPos={pos('userInfo')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="w-full h-full flex items-center px-3 relative overflow-hidden">
            <span className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center overflow-hidden shrink-0 ring-[3px] ring-white/90 relative z-10">
              {childAvatar ? (
                <img src={childAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <img src="/assets/ui/ui_avatar_default_child.webp" alt="" className="w-full h-full rounded-full object-cover" />
              )}
            </span>
            <div
              className="relative z-0 -ml-8 flex-1 min-w-0 h-[54px] rounded-full flex flex-col justify-center pl-10 pr-4 border border-white/60 backdrop-blur-md"
              style={{ background: 'linear-gradient(90deg, rgba(196,229,186,0.65), rgba(255,255,255,0.45) 55%, rgba(255,241,202,0.65))' }}
            >
              <p className="font-bold text-[15px] text-gray-800 leading-tight truncate">{childName}</p>
              <p className="text-[11px] mt-1 leading-tight whitespace-nowrap">
                <span className="font-bold text-amber-600">Lv.{gardenLevel}</span>
                <span className="text-green-600 font-medium ml-1.5">{stageLabel || STAGE_NAMES[stageIndex].replace('期', '')}阶段</span>
              </p>
            </div>
          </div>
        </DraggableBlock>

        {/* Left column — garden status */}
        <DraggableBlock
          blockId="gardenStatus" defaultPos={pos('gardenStatus')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="solid-card card-module p-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-green-800 inline-flex items-center gap-1">
                <UiIcon name="leafLine" size={14} className="text-green-600" />今日花园状态
              </h3>
              <button className="text-gray-300 hover:text-gray-400" title="帮助"><UiIcon name="info" size={14} /></button>
            </div>
            <div className="flex-1 flex items-center justify-center py-1">
              <div className="relative w-[86px] h-[86px]">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(78,106,62,0.12)" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke="url(#healthGrad)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(100, Math.max(0, healthScore)) / 100)}`}
                  />
                  <defs>
                    <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A5D6A7" />
                      <stop offset="100%" stopColor="#2E7D32" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[30px] font-bold text-green-700 leading-none">{healthScore}</span>
                  <span className="text-[9px] text-green-600 mt-0.5">健康指数</span>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] text-green-700">健康指数：良好</p>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {statusRows.map((r) => (
                <div key={r.label} className="flex flex-col items-center bg-white/55 border border-white/60 rounded-xl py-2">
                  <UiIcon name={r.icon} size={18} className={r.color} />
                  <span className="text-[11px] text-gray-400 mt-1">{r.label}</span>
                  <span className="text-xs font-semibold text-gray-600">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-2 border-t border-white/70 flex items-center justify-between gap-2">
              <span className="text-[9px] text-gray-400 whitespace-nowrap">今日任务</span>
              <div className="flex-1"><ProgressBar value={doneCount} max={5} color="bg-garden-mascot" /></div>
              <span className="text-[10px] font-bold text-garden-forest">{doneCount}/5</span>
            </div>
          </div>
        </DraggableBlock>

        {/* Left column — tip */}
        <DraggableBlock
          blockId="tipCard" defaultPos={pos('tipCard')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="cream-card card-module p-3.5 h-full">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-bold text-sm text-amber-800">今日小贴士</h3>
              <span className="ml-auto flex items-center"><UiIcon name="lightbulbLine" size={15} className="text-amber-500" /></span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">多吃蔬菜和水果，帮助益生菌茁壮成长哦！</p>
          </div>
        </DraggableBlock>

        {/* 欢迎语 */}
        <DraggableBlock
          blockId="welcomeBanner" defaultPos={pos('welcomeBanner')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center scale-150">
              <h1 className="text-xl font-bold text-garden-forest leading-tight">
                欢迎回来，{childName}！
              </h1>
              <p className="text-xs text-emerald-600 mt-0.5">你的肠道花园正在茁壮成长</p>
            </div>
          </div>
        </DraggableBlock>

        {/* 小园精灵 + 对话框 */}
        <DraggableBlock
          blockId="mascot" defaultPos={pos('mascot')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="flex items-center justify-center h-full pl-6">
            <div className="bg-white rounded-3xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-600 shadow-md shrink-0 mr-2 leading-relaxed text-center ml-2">
              今天一起照顾<br/>小居民吧！
            </div>
            <img
              src="/assets/characters/png/char_bighead_home.webp"
              alt="菌小园"
              className="h-[82%] object-contain drop-shadow-lg animate-bounce-slow"
            />
          </div>
        </DraggableBlock>

        <DraggableBlock
          blockId="heroCTA" defaultPos={pos('heroCTA')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="relative h-full flex items-center justify-center">
            <span className="absolute top-0 right-0 bg-[#FF9800]/90 text-white text-[9px] px-2 py-0.5 rounded-full font-medium z-10">
              推荐 每日一次
            </span>
            <button
              className="flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-transform origin-center relative"
              onClick={() => setStoolModalOpen(true)}
              style={{
                animation: 'floatBlink 2s ease-in-out infinite',
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  top: '-1.5rem',
                  bottom: '-1.5rem',
                  left: '-3rem',
                  right: '-3rem',
                  background: 'radial-gradient(ellipse at center, rgba(255,60,0,0.9) 0%, rgba(255,80,20,0.7) 30%, rgba(255,120,50,0.4) 55%, transparent 75%)',
                  filter: 'blur(4px)',
                }}
              />
              <UiIcon name="camera" size={48} className="text-white relative" />
              <span className="font-bold text-2xl text-white leading-tight relative whitespace-nowrap">今日肠道扫描</span>
              <span className="text-sm text-white/80 leading-tight text-center relative">扫码一次</span>
            </button>
            <style>{`
              @keyframes floatBlink {
                0%, 100% { transform: translateY(0); opacity: 1; }
                40% { transform: translateY(-6px); opacity: 0.7; }
                70% { transform: translateY(-2px); opacity: 0.85; }
              }
            `}</style>
          </div>
        </DraggableBlock>

        {/* 金刚区屋形轮廓定义（平滑贝塞尔） */}
        <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id="kk-house" clipPathUnits="objectBoundingBox">
              <path d={HOUSE_PATH} />
            </clipPath>
          </defs>
        </svg>

        {/* Bottom feature cards — colored border style */}
        {KINGKONGS.map((kk) => (
          <DraggableBlock
            key={kk.id}
            blockId={kk.id}
            defaultPos={pos(kk.id)}
            editing={editing}
            containerRef={containerRef}
            onMove={handleMove} onResize={handleResize}
          >
            <div className="w-full h-full hover:scale-[1.02] active:scale-95 transition-all relative"
                 style={{ filter: 'drop-shadow(0 3px 8px rgba(78,106,62,0.14))' }}>
              {/* 图片独立于 clipPath 之外，允许超出卡片边界 */}
              <img
                src={kk.img} alt={kk.label}
                className="absolute top-0 left-1/2 w-[65%] object-contain drop-shadow-sm scale-150 z-10 pointer-events-none -translate-x-1/2 -translate-y-[5%]"
              />
              <button
                className="w-full h-full p-1.5 relative"
                style={{ clipPath: HOUSE_CLIP, background: softBorder(kk.borderColor, kk.borderAlpha) }}
                onClick={() => { sfx.click(); navigate(kk.path) }}
              >
                <div className="w-full h-full flex flex-col items-center justify-end pb-2 px-2 relative"
                     style={{ clipPath: HOUSE_CLIP, background: kk.fill }}>
                  <div className="px-2 pb-6 pt-[42%] text-center">
                    <span className="block font-bold text-lg leading-tight" style={{ color: kk.titleColor }}>{kk.label}</span>
                    <span className="block text-xs text-gray-500 leading-relaxed mt-0.5 whitespace-pre-line">{kk.desc}</span>
                  </div>
                  {/* 右下角箭头：主题色圆角方块 + 白色实心三角（参照参考图） */}
                  <div className="absolute right-[9px] bottom-[9px] w-[22px] h-[22px] rounded-[8px] flex items-center justify-center pointer-events-none shadow-sm"
                       style={{ background: kk.borderColor }}>
                    <svg width="13" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                      <path d="M3.5 1.5 L13 7.5 L3.5 13.5 Z" fill="white" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </DraggableBlock>
        ))}

        {/* 花园成长进度 bar — 参照参考图：米色底 + 大标题 + 大节点 + 连接线 */}
        <DraggableBlock
          blockId="badgePanel" defaultPos={pos('badgePanel')}
          editing={editing} movable
          containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div
            className="card-module h-full flex items-center gap-3 px-4"
            style={{
              borderRadius: '20px',
              boxShadow: '0 2px 10px rgba(78,106,62,0.05)',
            }}
          >
            <div className="shrink-0 self-center">
              <p className="text-[18px] font-bold text-[#2E7D32] leading-tight whitespace-nowrap">花园成长进度</p>
              <p className="text-[13px] font-medium text-[#666] leading-tight whitespace-nowrap mt-1">
                已成长 <span className="text-[#FF6D00] font-bold">{streak}</span> 天
              </p>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center px-14">
              {/* 圆圈 + 连接线 */}
              <div className="relative flex items-center justify-between px-[6px]">
                <div className="absolute left-[24px] right-[24px] top-1/2 -translate-y-1/2 h-[8px] rounded-full bg-[#E8E4D5]" />
                {STAGE_NAMES.map((name, i) => {
                  const unlocked = i <= stageIndex
                  const isCurrent = i === stageIndex
                  return (
                    <Fragment key={name}>
                      {i > 0 && (
                        <div className={`relative z-10 flex-1 h-[8px] rounded-full ${i <= stageIndex + 1 ? 'bg-gradient-to-r from-[#FFB74D] to-[#FF9800]' : 'bg-transparent'}`} />
                      )}
                      <span
                        className={`relative z-10 w-[36px] h-[36px] rounded-full border-2 flex items-center justify-center shadow-sm shrink-0 ${
                          unlocked
                            ? 'border-[#66BB6A] bg-gradient-to-b from-[#8BC34A] to-[#4CAF50]'
                            : 'border-[#D8D4C6] bg-[#E8E4DA]'
                        }`}
                      >
                        {unlocked
                          ? <UiIcon name={STAGE_ICONS[i]} size={20} className="text-white drop-shadow-sm" />
                          : <UiIcon name="lock" size={15} className="text-[#B0AB9C]" />}
                      </span>
                    </Fragment>
                  )
                })}
              </div>
              {/* 阶段名称标签 */}
              <div className="flex justify-between px-[6px] mt-2">
                {STAGE_NAMES.map((name, i) => {
                  const unlocked = i <= stageIndex
                  const isCurrent = i === stageIndex
                  return (
                    <span
                      key={name}
                      className={`text-[10px] leading-none whitespace-nowrap text-center ${
                        isCurrent ? 'text-[#2E7D32] font-bold' : unlocked ? 'text-[#5B8C4E]' : 'text-[#A8A298]'
                      }`}
                    >
                      {name}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="shrink-0 self-center flex flex-col items-center gap-1">
              <img src="/assets/ui/ui_reward_house.webp" alt="下一份惊喜" className="h-[42px] w-[42px] object-contain" />
              <span className="text-[12px] font-semibold text-[#FF9800] leading-none whitespace-nowrap">下一份惊喜</span>
            </div>
          </div>
        </DraggableBlock>

        {/* Right panel — AI assistant */}
        <DraggableBlock
          blockId="aiPanel" defaultPos={pos('aiPanel')}
          editing={editing} movable resizable
          containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="solid-card card-module p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-md overflow-hidden">
                  <img src="/assets/characters/png/char_xiaoyuan.webp" alt="菌小园助手" className="w-7 h-7 object-contain" />
                </span>
                <h3 className="font-bold text-sm text-green-700">菌小园助手</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="bg-[#E8F5E8] rounded-xl rounded-bl-sm p-3 mb-2">
                <p className="text-xs text-gray-600">嗨！我是你的AI菌小园助手~</p>
              </div>
              <div className="bg-white rounded-xl rounded-bl-sm p-3 mb-3 border border-black/5">
                <p className="text-xs text-gray-500">今天想了解什么呢？</p>
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                {AI_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="group flex items-center justify-between gap-2 text-xs text-left text-gray-600 hover:text-garden-forest bg-white/80 rounded-xl px-3 py-2 hover:bg-white transition-colors border border-black/5"
                  >
                    <span>{q}</span>
                    <span className="text-gray-300 group-hover:text-garden-forest shrink-0">›</span>
                  </button>
                ))}
              </div>
              <button
                className="w-full py-2 bg-[#4CAF50] text-white rounded-xl text-xs font-bold hover:bg-[#43A047] active:scale-95 transition-all"
                onClick={() => setAiChatOpen(true)}
              >
                和我聊天
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/60 text-xs shrink-0">
              <p className="font-bold text-gray-500 mb-1.5 inline-flex items-center gap-1"><UiIcon name="chart" size={13} />今日观察</p>
              <ul className="text-[11px] text-gray-400 space-y-1">
                <li className="inline-flex items-center gap-1"><UiIcon name="dropletLine" size={11} className="text-sky-500" />连续 {streak} 天喝水达标</li>
                <li className="inline-flex items-center gap-1"><UiIcon name="treeLine" size={11} className="text-green-500" />蔬菜摄入稍少，建议多吃深色蔬菜</li>
                <li className="inline-flex items-center gap-1"><UiIcon name="handshakeLine" size={11} className="text-amber-500" />今日互动 {interactionCount} 次</li>
              </ul>
              <button
                className="text-garden-forest hover:underline mt-1.5 text-[11px] font-medium"
                onClick={() => navigate('/report')}
              >
                查看完整报告 &gt;
              </button>
            </div>
          </div>
        </DraggableBlock>
      </div>
    </div>
  )
}
