import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useClassroomStore } from '@/stores/classroomStore'
import { useAuthStore } from '@/stores/authStore'
import { useGardenStore } from '@/stores/gardenStore'
import { api } from '@/lib/api'
import { sfx } from '@/lib/sound'
import { isRegistered, getActiveChildId } from '@/hooks/useApiSync'
import { UiIcon } from '@/lib/uiIcons'
import { MODULE_SOURCES, CARD_SOURCE_DISCLAIMER } from '@/lib/cardSources'
import TopRightControls from '@/components/navigation/TopRightControls'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import { savePositions } from '@/hooks/useEditMode'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface PathNode {
  id: string
  title: string
  subtitle: string
  icon: string
  cardImage: string
  video: string
  color: { circle: string; card: string; title: string; sub: string; text?: string }
  /** 标签锚点（圆圈中心）在场景画布中的百分比位置 —— 依据参考图实测 */
  pos: { left: number; top: number }
}

// 圆圈 / 卡片配色 —— 像素级实测自参考图（1672×941）
const NODE_COLORS = {
  green:  { circle: '#9BC853', card: 'rgba(238, 242, 211, 0.96)', title: '#4F8025', sub: '#525633' },
  purple: { circle: '#C28DD3', card: 'rgba(241, 231, 246, 0.96)', title: '#4F447B', sub: '#493A5D' },
  sky:    { circle: '#4CB1DA', card: 'rgba(211, 240, 233, 0.96)', title: '#346979', sub: '#696F45' },
  blue:   { circle: '#76C0E8', card: 'rgba(221, 236, 241, 0.96)', title: '#5E4F2B', sub: '#74815D' },
  yellow: { circle: '#F2D54E', card: 'rgba(250, 244, 205, 0.96)', title: '#4F5D1F', sub: '#6B5E1E', text: '#5A4E1F' },
}

// 与首页金刚区一致：主题色向白色混合，得到"淡色加粗"描边色
const softBorder = (hex: string, a: number) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const w = 0.62
  return `rgba(${Math.round(r + (255 - r) * w)}, ${Math.round(g + (255 - g) * w)}, ${Math.round(b + (255 - b) * w)}, ${a})`
}

// 位置 = 参考图(1672×941)中圆圈中心的百分比，y 已按内容区(dock 之上)换算到本页坐标系
const NODES: PathNode[] = [
  {
    id: 'node1_fiber',
    title: '膳食纤维广场',
    subtitle: '认识纤维小能手',
    icon: 'landmark',
    cardImage: '/assets/cards/card_fiber_square.webp',
    video: '/assets/videos/fiber.mp4',
    color: NODE_COLORS.green,
    pos: { left: 17.8, top: 29.4 },
  },
  {
    id: 'node2_ferment',
    title: '菌菌发酵坊',
    subtitle: '菌群的神奇魔法',
    icon: 'factory',
    cardImage: '/assets/cards/card_ferment_workshop.webp',
    video: '/assets/videos/ferment.mp4',
    color: NODE_COLORS.purple,
    pos: { left: 52.3, top: 27.3 },
  },
  {
    id: 'node3_scfa',
    title: '短链脂肪酸泉',
    subtitle: '生命能量的源泉',
    icon: 'droplets',
    cardImage: '/assets/cards/card_scfa_spring.webp',
    video: '/assets/videos/scfa.mp4',
    color: NODE_COLORS.sky,
    pos: { left: 35.3, top: 48.1 },
  },
  {
    id: 'node4_barrier',
    title: '肠道屏障城',
    subtitle: '守护肠道小卫士',
    icon: 'brick',
    cardImage: '/assets/cards/card_barrier_wall.webp',
    video: '/assets/videos/barrier.mp4',
    color: NODE_COLORS.blue,
    pos: { left: 16.3, top: 75.3 },
  },
  {
    id: 'node5_eco',
    title: '生态观察站',
    subtitle: '观察我的肠道生态',
    icon: 'telescope',
    cardImage: '/assets/cards/card_eco_station.webp',
    video: '/assets/videos/eco.mp4',
    color: NODE_COLORS.yellow,
    pos: { left: 59.6, top: 76.3 },
  },
]

// 地图节点 → 后端知识模块 code 映射（注册模式用真实进度覆盖静态占位数据）
const MODULE_CODE_BY_NODE: Record<string, string> = {
  node1_fiber: 'fiber_square',
  node2_ferment: 'ferment_workshop',
  node3_scfa: 'scfa_spring',
  node4_barrier: 'barrier_wall',
  node5_eco: 'eco_station',
}

// ── Edit-mode defaults：以 1672×941 视口的手机框内容区为基准（W=1454, H=841） ──
// 百分比位置换算为像素，作为 useEditorPage 的初始默认值
const REF_W = 1454
const REF_H = 841
const pcW = (pct: number) => Math.round(REF_W * pct / 100)
const pcH = (pct: number) => Math.round(REF_H * pct / 100)

const CLASSROOM_DEFAULTS: Record<string, BlockPos> = {
  userBox:      { x: 16,     y: 16,               w: 264,     h: 128 },
  knowledgeTree:{ x: 1023,   y: 8,                w: 375,     h: 140 },
  sprite:       { x: 0,      y: pcH(70),          w: pcW(18), h: pcH(30) },
  cloudBanner:  { x: pcW(26), y: 0,                w: pcW(44), h: pcH(15.5) },
  taskBar:      { x: pcW(19), y: pcH(82.2),        w: pcW(25), h: pcH(21) },
  chestBar:     { x: pcW(45), y: pcH(82.8),        w: pcW(33), h: pcH(17.2) },
  aiPanel:      { x: pcW(78), y: pcH(19),          w: pcW(22), h: pcH(78.5) },
  node1_fiber:  { x: pcW(50) - 25, y: pcH(50) - 32, w: 250, h: 64 },
  node2_ferment:{ x: pcW(52.3) - 25, y: pcH(27.3) - 32, w: 240, h: 64 },
  node3_scfa:   { x: pcW(35.3) - 25, y: pcH(48.1) - 32, w: 250, h: 64 },
  node4_barrier:{ x: pcW(16.3) - 25, y: pcH(75.3) - 32, w: 240, h: 64 },
  node5_eco:    { x: pcW(59.6) - 25, y: pcH(76.3) - 32, w: 245, h: 64 },
}

// 将 BlockPos（REF_W×REF_H 像素坐标系）转回百分比样式，供普通模式使用
const pLeft   = (x: number) => `${((x / REF_W) * 100).toFixed(1)}%`
const pTop    = (y: number) => `${((y / REF_H) * 100).toFixed(1)}%`
const pWidth  = (w: number) => `${((w / REF_W) * 100).toFixed(1)}%`
const pHeight = (h: number) => `${((h / REF_H) * 100).toFixed(1)}%`
const pBottom = (y: number, h: number) => `${(((REF_H - y - h) / REF_H) * 100).toFixed(1)}%`

const TREE_STAGES = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const STAGE_NAMES = ['幼苗期', '成长期', '繁荣期', '茂盛期', '丰收期', '守护期']

const FAQS = [
  { icon: 'apple', title: '食物的秘密', question: '为什么有的食物更健康？' },
  { icon: 'sprout', title: '菌居民知识', question: '菌群们都在做什么？' },
  { icon: 'checkCircle', title: '健康好习惯', question: '怎样养成好习惯？' },
]

const RECOMMENDS = [
  { icon: 'droplet', title: '水分与肠道生态', question: '水对肠道有什么影响呢？', reward: 10 },
  { icon: 'leaf', title: '蔬菜的魔法', question: '蔬菜如何帮助菌居民？', reward: 10 },
]

/* ── 知识树成长卡片：树图标（复刻参考图的圆冠小树） ── */
function TreeIcon() {
  return (
    <svg viewBox="0 0 34 23" width="34" height="23" className="block" aria-hidden="true">
      {/* 树干（最后绘制，盖在树冠前） */}
      <rect x="14.5" y="18.5" width="5" height="4" rx="1.8" fill="#8A6B32" />
      {/* 深绿底部椭圆（完整树冠剪影） */}
      <ellipse cx="17" cy="11.5" rx="16.5" ry="11" fill="#5C9843" />
      {/* 中绿侧冠 */}
      <circle cx="7" cy="14.5" r="6.5" fill="#89B652" />
      <circle cx="27" cy="14.5" r="6.5" fill="#7DA34A" />
      <circle cx="17" cy="13" r="8.5" fill="#9DC14D" />
      {/* 中绿下摆（加宽底部） */}
      <circle cx="6.5" cy="17" r="6" fill="#89B652" />
      <circle cx="27.5" cy="17" r="6" fill="#7DA34A" />
      {/* 浅绿顶冠（复刻参考图的中绿，不过度偏黄） */}
      <circle cx="11.5" cy="8" r="7" fill="#9ABC4E" />
      <circle cx="22.5" cy="8.5" r="6.5" fill="#90B44A" />
      <circle cx="17" cy="7" r="8.2" fill="#A2C254" />
      {/* 顶部高光 */}
      <ellipse cx="12" cy="4.5" rx="6" ry="3" fill="#C8D868" />
    </svg>
  )
}

/* ── 知识树成长卡片：标题旁的小叶图标（复刻参考图灰叶） ── */
function LeafIcon() {
  return (
    <svg viewBox="0 0 21 19" width="18" height="16" className="block shrink-0" aria-hidden="true">
      <path d="M10.5 1C6 2.5 4 6.5 4 10c0 3 2 6 6.5 7.5C15 16 17 13 17 10c0-3.5-2-7.5-6.5-9z" fill="#D8D5CC" />
      <path d="M10.5 2.5v13" stroke="#9E9A8F" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ClassroomPage() {
  const navigate = useNavigate()
  const setAiChatOpen = useUIStore((s) => s.setAiChatOpen)
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(null)
  const [watchStage, setWatchStage] = useState<'video' | 'reward'>('video')
  const [watchXp, setWatchXp] = useState(0)
  const [videoStarted, setVideoStarted] = useState(false)
  const [cardZoomed, setCardZoomed] = useState(false)
  const [showSource, setShowSource] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { user } = useAuthStore()
  const { gardenLevel } = useGardenStore()

  const modules = useClassroomStore((s) => s.modules)
  const nodes = NODES.map((node) => {
    const mod = modules.find((m) => m.code === MODULE_CODE_BY_NODE[node.id])
    return { ...node, stars: mod?.stars ?? 0, maxStars: 6, unlocked: mod?.unlocked ?? false, watched: mod?.animationWatched ?? false }
  })

  const openNode = (node: PathNode) => {
    sfx.click()
    setSelectedNode(node)
    setWatchStage('video')
    setWatchXp(0)
    setVideoStarted(false)
    setCardZoomed(false)
    setShowSource(false)
  }

  const closeNode = () => {
    sfx.pop()
    setSelectedNode(null)
    setWatchStage('video')
    setVideoStarted(false)
    setCardZoomed(false)
    setShowSource(false)
  }

  const handleStartLearn = () => {
    sfx.click()
    setVideoStarted(true)
    videoRef.current?.play().catch(() => {})
  }

  const markModuleWatched = (moduleCode: string, node: PathNode) => {
    const { modules } = useClassroomStore.getState()
    const existing = modules.find((m) => m.code === moduleCode)
    const patch = {
      title: existing?.title ?? node.title,
      description: existing?.description ?? node.subtitle,
      card_count: existing?.card_count ?? 1,
      quiz_count: existing?.quiz_count ?? 3,
      progress: existing?.progress ?? 0,
      stars: existing?.stars ?? 0,
      unlocked: true,
      animationWatched: true,
      cardsUnlocked: Math.max(existing?.cardsUnlocked ?? 0, 1),
    }
    const next = existing
      ? modules.map((m) => (m.code === moduleCode ? { ...m, ...patch } : m))
      : [...modules, { ...patch, code: moduleCode }]
    useClassroomStore.setState({ modules: next })
  }

  const handleVideoEnd = async () => {
    const node = selectedNode
    if (!node) return
    const moduleCode = MODULE_CODE_BY_NODE[node.id]
    let xp = 0
    if (isRegistered()) {
      const childId = getActiveChildId()
      if (childId) {
        try {
          const res = await api.post<{ xp_gained: number }>(`/classroom/modules/${moduleCode}/watch`, { child_id: childId })
          xp = res.xp_gained ?? 0
        } catch { /* toast handled globally */ }
      }
    }
    markModuleWatched(moduleCode, node)
    setWatchXp(xp)
    sfx.celebrate()
    if (xp > 0) sfx.coin()
    setWatchStage('reward')
  }
  // 真实数据：宝箱按已掌握知识点数（各模块 quiz 通过数之和）解锁；树按已观看动画的模块数点亮
  const totalStars = modules.reduce((a, m) => a + (m.stars ?? 0), 0)
  const treeProgress = nodes.filter((n) => n.watched).length

  const childName = user?.children.find((c) => c.id === user.active_child_id)?.name ?? '宝宝'
  const childAvatar = user?.children.find((c) => c.id === user.active_child_id)?.avatar_url
  const stageIndex = Math.max(0, Math.min(STAGE_NAMES.length - 1, (gardenLevel || 1) - 1))

  const chests = [
    { label: '探索 1 个知识点', threshold: 1, color: 'from-green-400 to-green-600' },
    { label: '探索 3 个知识点', threshold: 3, color: 'from-amber-400 to-amber-600' },
    { label: '探索 5 个知识点', threshold: 5, color: 'from-sky-400 to-sky-600' },
    { label: '探索 8 个知识点', threshold: 8, color: 'from-purple-400 to-purple-600' },
    { label: '探索 12 个知识点', threshold: 12, color: 'from-yellow-400 to-yellow-600' },
  ].map((c) => ({ ...c, done: totalStars >= c.threshold }))

  const { editing, containerRef, positions, pos, handleMove, handleResize, handleReset } = useEditorPage('classroom', CLASSROOM_DEFAULTS, {
    // 迁移旧版保存的布局（一次性）：① 左侧 node1 移到中央 ② 旧窄卡宽度升级到参考图宽度
    init: (merged, layoutVersion) => {
      // v2 起布局已迁移过，尊重用户手动拖拽/调整的位置
      if (layoutVersion >= 2) return merged
      // 仅迁移真正的旧版窄卡布局（w≈135~175）；用户拖到左侧(x<500)的宽卡保持不动
      if (merged.node1_fiber && merged.node1_fiber.x < 500 && merged.node1_fiber.w < 230) {
        merged = { ...merged, node1_fiber: CLASSROOM_DEFAULTS.node1_fiber }
      }
      for (const id of ['node1_fiber', 'node2_ferment', 'node3_scfa', 'node4_barrier', 'node5_eco']) {
        const d = CLASSROOM_DEFAULTS[id]
        const m = merged[id]
        if (m && (m.w < d.w - 20 || m.h < d.h - 10)) {
          merged = { ...merged, [id]: { ...m, w: Math.max(m.w, d.w), h: Math.max(m.h, d.h) } }
        }
      }
      // 迁移旧版保存的布局：AI 面板顶部下移到知识树成长卡片下方（参考图布局）
      if (merged.aiPanel && merged.aiPanel.y < pcH(15)) {
        merged = { ...merged, aiPanel: { ...merged.aiPanel, y: pcH(19), h: pcH(78.5) } }
      }
      // 无论是否有改动，都标记为已迁移（v2），确保迁移只执行一次
      savePositions('classroom', merged)
      return merged
    },
  })

  /* ── 共享内容片段（编辑 / 普通模式复用） ── */

  const userBoxContent = (
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
          <span className="text-green-600 font-medium ml-1.5">{STAGE_NAMES[stageIndex].replace('期', '')}阶段</span>
        </p>
      </div>
    </div>
  )

  const spriteContent = (
    <div className="relative w-full h-full">
      <img
        src="/assets/characters/png/char_bighead_home.webp"
        alt="菌小园"
        className="absolute bottom-0 left-0 h-[82%] object-contain drop-shadow-lg animate-bounce-slow"
      />
      <div className="absolute top-[calc(6%+40px)] right-[100px] bg-white rounded-3xl rounded-bl-sm px-3 py-2 text-[13px] font-medium text-gray-600 shadow-md leading-snug">
        想探索什么<br />知识？
      </div>
    </div>
  )

  const cloudContent = (
    <div className="relative w-full h-full">
      <div className="absolute -top-[6%] left-[7%] w-[21%] h-[34%] bg-[#FDFAF0] rounded-full shadow-[0_3px_6px_rgba(150,170,90,0.18)]" />
      <div className="absolute -top-[9%] left-[37%] w-[26%] h-[42%] bg-[#FDFAF0] rounded-full shadow-[0_3px_6px_rgba(150,170,90,0.18)]" />
      <div className="absolute -top-[5%] right-[8%] w-[21%] h-[32%] bg-[#FDFAF0] rounded-full shadow-[0_3px_6px_rgba(150,170,90,0.18)]" />
      <div className="absolute inset-0 bg-[#FDFAF0] rounded-b-[2.4rem] shadow-[0_6px_16px_rgba(120,145,70,0.30)] border-b border-white/90 flex flex-col items-center justify-center pt-1">
        <p className="font-black text-[36px] leading-none text-[#2F6B1F] [-webkit-text-stroke:1px_#2F6B1F] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] inline-flex items-center px-2">
          <span className="text-[96px] text-[#7FA84E] mr-5" style={{ transform: 'rotate(-30deg) translateY(14px)' }}><UiIcon name="leaf" size={114} /></span>
          <span className="inline-block" style={{ transform: 'rotate(-20deg) translateY(-2px)' }}>探</span>
          <span className="inline-block" style={{ transform: 'rotate(-7deg) translateY(-14px)' }}>索</span>
          <span className="inline-block" style={{ transform: 'rotate(7deg) translateY(-14px)' }}>课</span>
          <span className="inline-block" style={{ transform: 'rotate(20deg) translateY(-2px)' }}>堂</span>
          <span className="text-[96px] text-[#7FA84E] ml-5" style={{ transform: 'rotate(30deg) translateY(14px)' }}><UiIcon name="leaf" size={114} /></span>
        </p>
        <p className="mt-1.5 text-[13px] font-medium text-[#4A3B28] tracking-wide">探索肠道生命的秘密</p>
      </div>
    </div>
  )

  const nodeBtnContent = (node: typeof nodes[0] & { id: string; title: string; subtitle: string; color: { circle: string; card: string; title: string; sub: string } }, idx: number) => (
    <button
      className="flex items-center gap-2.5 group cursor-pointer h-full"
      onClick={() => openNode(node)}
    >
      <span
        className="relative w-[50px] h-[50px] rounded-full text-xl font-bold flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110"
        style={{ background: node.color.circle, color: node.color.text ?? '#fff' }}
      >
        {node.watched ? <UiIcon name="check" size={22} /> : idx + 1}
        {node.watched && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center ring-2 ring-white shadow text-[10px] leading-none">✓</span>
        )}
      </span>
      <span
        className="rounded-xl px-6 py-1.5 text-left backdrop-blur transition-all group-hover:shadow-xl"
        style={{
          background: node.color.card,
          border: `3px solid ${softBorder(node.color.circle, 0.55)}`,
          boxShadow: '0 3px 10px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255,255,255,0.65)',
        }}
      >
        <span className="block font-bold text-[26px] leading-tight whitespace-nowrap" style={{ color: node.color.title }}>{node.title}</span>
        <span className="block text-[17px] leading-tight mt-1 whitespace-nowrap" style={{ color: node.color.sub }}>{node.subtitle}</span>
      </span>
    </button>
  )

  const aiPanelContent = (
    <div className="card-module flex flex-col overflow-hidden rounded-l-2xl shadow-2xl w-full h-full">
      <div className="flex items-center justify-between px-3 pt-3 pb-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none"><UiIcon name="sparkles" size={14} className="text-garden-mascot" /></span>
          <h3 className="font-bold text-[13px] text-garden-forest">菌小园老师</h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 text-gray-500 text-xs flex items-center justify-center" title="最小化">−</button>
          <button className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 text-gray-500 text-xs flex items-center justify-center" title="关闭" onClick={() => setAiChatOpen(false)}>×</button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 pt-1.5 pb-2 shrink-0">
        <img src="/assets/characters/png/char_xiaoyuan.webp" alt="菌小园老师" className="w-11 h-11 object-contain shrink-0 drop-shadow" />
        <div className="bg-white/90 rounded-xl rounded-bl-sm px-2.5 py-1.5 shadow-sm border border-white flex-1 min-w-0">
          <p className="text-[11px] text-gray-600 leading-snug inline-flex items-start gap-1">
            <UiIcon name="message" size={12} className="mt-0.5 shrink-0 text-garden-mascot" />
            <span>嗨，小明！今天想一起探索什么呢？</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1 px-3 shrink-0">
        {FAQS.map((f) => (
          <button
            key={f.title}
            className="flex items-center gap-2 text-left bg-white/75 rounded-xl px-2.5 py-1.5 hover:bg-white/95 transition-colors shadow-sm"
            onClick={() => setAiChatOpen(true)}
          >
            <span className="text-sm shrink-0"><UiIcon name={f.icon} size={16} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-bold text-gray-600 leading-tight">{f.title}</span>
              <span className="block text-[9px] text-gray-400 truncate">{f.question}</span>
            </span>
            <span className="text-gray-300 text-xs shrink-0">›</span>
          </button>
        ))}
      </div>
      <button
        className="mx-3 mt-2 text-[11px] font-bold text-white bg-gradient-to-b from-garden-mascot to-[#7A9538] rounded-xl py-2 shadow-md hover:brightness-105 active:scale-95 transition-all shrink-0"
        onClick={() => setAiChatOpen(true)}
      >
        <UiIcon name="dice" size={13} className="inline mr-1 -mt-0.5 align-middle" />
        随机探索
      </button>
      <div className="flex-1 min-h-0 flex flex-col px-3 pt-2 pb-2.5">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <p className="text-[11px] font-bold text-gray-500 inline-flex items-center gap-1"><UiIcon name="newspaper" size={12} />为你推荐</p>
          <button className="text-[9px] text-garden-forest hover:underline inline-flex items-center gap-0.5"><UiIcon name="swap" size={10} />换一换</button>
        </div>
        <div className="flex flex-col gap-1.5 overflow-auto min-h-0">
          {RECOMMENDS.map((r) => (
            <div key={r.title} className="flex items-center gap-2 bg-white/80 rounded-xl px-2.5 py-2 shadow-sm border border-white/70">
              <span className="text-base shrink-0"><UiIcon name={r.icon} size={20} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold text-gray-600 truncate">{r.title}</span>
                <span className="block text-[9px] text-gray-400 truncate">{r.question}</span>
                <span className="text-[9px] text-garden-gold font-bold">奖励：能量 +{r.reward}</span>
              </span>
              <span className="text-gray-300 shrink-0"><UiIcon name="star" size={13} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const treeCardContent = (
    <div className="card-module w-full h-full rounded-[24px] px-7 pb-4 pt-5 shadow-[0_8px_24px_rgba(120,145,90,0.18)]">
      {/* 标题行 */}
      <div className="flex items-center gap-2">
        <p className="font-bold text-[17px] leading-none text-black tracking-[0.01em]">知识树成长</p>
        <LeafIcon />
      </div>
      {/* 树列 */}
      <div className="flex items-center gap-2 mt-3">
        {TREE_STAGES.map((_, i) => (
          <span key={i} className={`flex items-center leading-none ${i < treeProgress ? '' : 'opacity-40 grayscale'}`}>
            <TreeIcon />
          </span>
        ))}
      </div>
      {/* 分隔线 */}
      <div className="h-[2px] w-full bg-[#F0EFEA] mt-[17px]" />
      {/* 底部信息行 */}
      <div className="flex items-center justify-between mt-[13px]">
        <p className="text-[12px] font-medium text-[#2E2A24] whitespace-nowrap">
          已探索 <span className="text-[13px] font-bold text-[#7DA34A]">{totalStars}</span> 个知识点
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] font-bold text-[#D9942E] whitespace-nowrap">下一阶段奖励</span>
          <UiIcon name="gift" size={15} className="shrink-0" />
        </div>
      </div>
    </div>
  )

  const taskBarContent = (
    <div
      className="card-module flex flex-col justify-center w-full h-full px-4 min-h-[124px]"
      style={{
        borderRadius: 20,
        boxShadow: '0 6px 20px rgba(78,106,62,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <h3 className="text-[18px] font-bold leading-none ml-[20px]" style={{ color: '#2E7D32' }}>今日小任务</h3>
      <p className="mt-1.5 text-[13px] text-[#333333] leading-snug ml-[20px]">
        完成任意一个知识挑战
        <br />
        获得 森林能量
      </p>
      <button className="mt-1.5 self-center text-[12px] font-bold text-white bg-gradient-to-b from-garden-mascot to-[#7A9538] rounded-full px-6 py-1.5 shadow-md hover:brightness-105 active:scale-95 transition-all">
        查看任务 →
      </button>
    </div>
  )

  const doneCount = chests.filter((c) => c.done).length
  const railFillPct = chests.length
    ? Math.max(0, Math.min(100, (((doneCount - 0.5) / chests.length) * 100 - 10) / 0.8))
    : 0

  const chestBarContent = (
    <div
      className="card-module flex flex-col justify-center w-full h-full px-[34px] py-2 rounded-[20px]"
      style={{
        boxShadow: '0 8px 24px rgba(140, 110, 60, 0.16)',
      }}
    >
      {/* 徽章行 */}
      <div className="flex items-start justify-between mb-[3px]">
        {chests.map((c) => (
          <div key={c.label} className="flex-1 flex justify-center">
            {c.done ? (
              <div className="w-[16px] h-[16px] rounded-full bg-[#7CBB42] text-white flex items-center justify-center text-[10px] font-bold leading-none shadow-sm">
                ✓
              </div>
            ) : (
              <div className="w-[16px] h-[16px] rounded-full bg-white/90 border border-[#DAD4C2] text-[7px] font-bold text-[#B3A689] flex items-center justify-center shadow-sm">
                {c.threshold}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 宝箱行 + 连接进度条 */}
      <div className="relative flex items-center justify-between mb-[3px]">
        <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-[7px] rounded-full bg-[#E2DCC6]" />
        {railFillPct > 0 && (
          <div
            className="absolute left-[10%] top-1/2 -translate-y-1/2 h-[7px] rounded-full bg-gradient-to-r from-[#E9C86D] to-[#D9A83F]"
            style={{ width: `calc(80% * ${(railFillPct / 100).toFixed(3)})` }}
          />
        )}
        {chests.map((c) => (
          <div key={c.label} className="flex-1 flex justify-center relative z-10">
            {c.threshold === 12 && !c.done && (
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(232,190,90,0.5)_0%,rgba(232,190,90,0.15)_55%,transparent_75%)] pointer-events-none" />
            )}
            <img
              src={c.done ? `/assets/ui/chest_unlocked_${c.threshold}.png` : '/assets/ui/chest_locked.webp'}
              alt={c.label}
              className={`h-[45px] w-auto object-contain drop-shadow-md ${c.done ? '' : 'opacity-80'}`}
            />
          </div>
        ))}
      </div>

      {/* 标签行 */}
      <div className="flex items-end justify-between">
        {chests.map((c) => (
          <div key={c.label} className="flex-1 flex justify-center">
            <p className={`text-[11.25px] leading-tight text-center ${c.done ? 'text-[#7CBB42] font-semibold' : 'text-[#9A8C70]'}`}>
              探索 {c.threshold} 个
              <br />
              知识点
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="relative flex flex-col min-h-full overflow-hidden bg-garden-cream gg-card-border-055">
      {/* ── 场景地图（全屏铺底，压住整个页面） ── */}
      <img
        src="/assets/scenes/scene_classroom_map.webp"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* ── 顶部 Header：返回 + 右上控件（浮于场景之上） ── */}
      <header className={`absolute top-0 inset-x-0 z-30 ${editing ? 'pointer-events-none' : ''}`}>
        <div className="relative z-[10] flex items-start justify-between px-4 pt-6">
          {/* 左：返回（与其它页面一致的圆形按钮） */}
          <button
            className="w-9 h-9 rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md hover:bg-[#7A9538] active:scale-95 transition-all"
            onClick={() => navigate('/')}
            title="返回首页"
          >
            <UiIcon name="chevronLeft" size={20} />
          </button>

          {/* 右：用户 + 声音 + 设置 */}
          <div className="flex items-center gap-2 shrink-0 mt-[12px]">
            <TopRightControls />
          </div>
        </div>
      </header>

      {/* ── 场景画布：标题云朵 + 节点标签 + AI 面板 + 底部任务条 ── */}
      <div className="absolute inset-0 z-10" ref={containerRef}>

        {editing && (
          <div className="absolute top-0 inset-x-0 z-50 bg-garden-coral/90 text-white text-[11px] text-center py-0.5 font-medium flex items-center justify-center gap-3 pointer-events-auto">
            <span>Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit</span>
            <button className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[11px] transition-colors" onClick={handleReset}>Reset All</button>
          </div>
        )}

        {/* 标题云朵横幅 */}
        {editing ? (
          <DraggableBlock blockId="cloudBanner" defaultPos={pos('cloudBanner')} editing containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            {cloudContent}
          </DraggableBlock>
        ) : (
          <div className="absolute top-0 z-[3] pointer-events-none select-none" style={{ left: pLeft(positions.cloudBanner.x), width: pWidth(positions.cloudBanner.w), height: pHeight(positions.cloudBanner.h) }}>
            {cloudContent}
          </div>
        )}

        {/* 右上角知识树成长卡片 */}
        {editing ? (
          <DraggableBlock blockId="knowledgeTree" defaultPos={pos('knowledgeTree')} editing zIndex={60} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            {treeCardContent}
          </DraggableBlock>
        ) : (
          <div className="absolute z-[10] pointer-events-none select-none" style={{ left: pLeft(positions.knowledgeTree.x), top: pTop(positions.knowledgeTree.y), width: pWidth(positions.knowledgeTree.w), height: pHeight(positions.knowledgeTree.h) }}>
            {treeCardContent}
          </div>
        )}

        {/* 左上角用户框 */}
        {editing ? (
          <DraggableBlock blockId="userBox" defaultPos={pos('userBox')} editing containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            {userBoxContent}
          </DraggableBlock>
        ) : (
          <div className="absolute z-[4] pointer-events-none select-none" style={{ left: pLeft(positions.userBox.x), top: pTop(positions.userBox.y), width: pWidth(positions.userBox.w), height: pHeight(positions.userBox.h) }}>
            {userBoxContent}
          </div>
        )}

        {/* 左下角精灵 */}
        {editing ? (
          <DraggableBlock blockId="sprite" defaultPos={pos('sprite')} editing containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            {spriteContent}
          </DraggableBlock>
        ) : (
          <div className="absolute z-[11] pointer-events-none select-none" style={{ left: pLeft(positions.sprite.x), top: pTop(positions.sprite.y), width: pWidth(positions.sprite.w), height: pHeight(positions.sprite.h) }}>
            {spriteContent}
          </div>
        )}

        {/* 节点标签 */}
        {editing
          ? nodes.map((node, idx) => (
              <DraggableBlock key={node.id} blockId={node.id} defaultPos={pos(node.id)} editing containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
                {nodeBtnContent(node, idx)}
              </DraggableBlock>
            ))
          : nodes.map((node, idx) => {
              const np = positions[node.id]
              // 节点以圆心定位：x+25 还原圆心 X%，y+h/2 还原圆心 Y%
              const cx = ((np.x + 25) / REF_W) * 100
              const cy = ((np.y + np.h / 2) / REF_H) * 100
              return (
                <div
                  key={node.id}
                  className="absolute"
                  style={{ left: `calc(${cx.toFixed(1)}% - 25px)`, top: `${cy.toFixed(1)}%`, transform: 'translateY(-50%)', zIndex: 5 }}
                >
                  {nodeBtnContent(node, idx)}
                </div>
              )
            })
        }

        {/* 右侧 AI 老师面板 */}
        {editing ? (
          <DraggableBlock blockId="aiPanel" defaultPos={pos('aiPanel')} editing movable resizable containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            {aiPanelContent}
          </DraggableBlock>
        ) : (
          <div className="absolute" style={{ top: pTop(positions.aiPanel.y), bottom: pBottom(positions.aiPanel.y, positions.aiPanel.h), left: pLeft(positions.aiPanel.x), width: pWidth(positions.aiPanel.w), zIndex: 10 }}>
            {aiPanelContent}
          </div>
        )}

        {/* 底部：今日任务（左） */}
        {editing ? (
          <DraggableBlock blockId="taskBar" defaultPos={pos('taskBar')} editing containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            {taskBarContent}
          </DraggableBlock>
        ) : (
          <div className="absolute" style={{ left: pLeft(positions.taskBar.x), top: pTop(positions.taskBar.y), width: pWidth(positions.taskBar.w), height: pHeight(positions.taskBar.h), zIndex: 10 }}>
            {taskBarContent}
          </div>
        )}

        {/* 底部：里程碑宝箱（中） */}
        {editing ? (
          <DraggableBlock blockId="chestBar" defaultPos={pos('chestBar')} editing containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            {chestBarContent}
          </DraggableBlock>
        ) : (
          <div className="absolute" style={{ left: pLeft(positions.chestBar.x), top: pTop(positions.chestBar.y), width: pWidth(positions.chestBar.w), height: pHeight(positions.chestBar.h), zIndex: 10 }}>
            {chestBarContent}
          </div>
        )}
      </div>

      {/* 节点详情弹窗 */}
      {selectedNode && (() => {
        const currentNode = nodes.find((n) => n.id === selectedNode.id)
        const watched = currentNode?.watched ?? false
        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeNode}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[min(384px,82vw)] max-h-[90vh] overflow-auto animate-in">
              <button
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-lg transition-colors"
                onClick={closeNode}
              >
                <UiIcon name="close" size={16} />
              </button>

              {watchStage === 'video' ? (
                /* ── 视频播放（占满 + 中央开始学习按钮） ── */
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-garden-forest inline-flex items-center gap-2">
                      <UiIcon name={selectedNode.icon} size={18} className="text-garden-forest" />
                      {selectedNode.title}
                    </h2>
                    {watched && (
                      <span className="text-[11px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                        <UiIcon name="check" size={12} /> 已获得
                      </span>
                    )}
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16]">
                    <video
                      key={selectedNode.id}
                      ref={videoRef}
                      src={selectedNode.video}
                      poster={selectedNode.cardImage}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                      onEnded={handleVideoEnd}
                    />
                    {!videoStarted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <button
                          className="flex flex-col items-center gap-2 px-10 py-4 rounded-2xl bg-white/95 hover:bg-white shadow-xl active:scale-95 transition-all"
                          onClick={handleStartLearn}
                        >
                          <span className="w-14 h-14 rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md">
                            <UiIcon name="play" size={26} />
                          </span>
                          <span className="font-bold text-garden-forest text-base">{watched ? '再看一次' : '开始学习'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-3">观看完成即可获得知识卡片</p>
                </div>
              ) : (
                /* ── 获得知识卡片 ── */
                <div className="py-6 text-center">
                  <p className="text-lg font-bold text-garden-forest mb-1 px-4">恭喜获得知识卡片！</p>
                  {watchXp > 0 && <p className="text-xs text-amber-600 font-bold mb-3 px-4">能量 +{watchXp}</p>}
                  <img
                    src={selectedNode.cardImage}
                    alt={selectedNode.title}
                    onClick={() => setCardZoomed(true)}
                    title="点击放大"
                    className="block w-[336px] max-w-full mx-auto rounded-xl shadow-lg ring-4 ring-garden-gold/70 cursor-zoom-in transition-transform hover:scale-[1.02]"
                  />
                  <p className="text-sm font-bold text-gray-700 mt-3 px-4">{selectedNode.title}</p>
                  <p className="text-xs text-gray-500 mt-1 px-4">{selectedNode.subtitle}</p>

                  {/* ── 科学依据折叠层 ── */}
                  {(() => {
                    const sources = MODULE_SOURCES[MODULE_CODE_BY_NODE[selectedNode.id]] ?? []
                    if (!sources.length) return null
                    return (
                      <div className="mt-3 mx-4 text-left">
                        <button
                          className="w-full flex items-center justify-between gap-2 bg-[#F4F1E4] hover:bg-[#eee9d5] rounded-xl px-3 py-2 text-[13px] font-bold text-[#6a6a50] transition-colors"
                          onClick={() => setShowSource(!showSource)}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <UiIcon name="book" size={14} className="text-[#8a8a5c]" />
                            科学依据
                          </span>
                          <span className="text-[10px] text-[#a8a279]">{showSource ? '收起 ▲' : '展开 ▼'}</span>
                        </button>
                        {showSource && (
                          <div className="mt-2 bg-white/80 rounded-xl border border-[#e5dfc8] p-3">
                            <ul className="space-y-2">
                              {sources.map((s) => (
                                <li key={s.title} className="text-[12px] leading-relaxed">
                                  <p className="font-bold text-[#5c5c45]">{s.title} <span className="font-medium text-[#9a9483]">— {s.org}</span></p>
                                  <p className="text-[#8a8a72] mt-0.5">{s.note}</p>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-2 pt-2 border-t border-[#ece7d2] text-[10px] text-[#b0ab93] flex items-start gap-1">
                              <UiIcon name="shield" size={11} className="shrink-0 mt-0.5" />
                              {CARD_SOURCE_DISCLAIMER}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  <button
                    className="mt-4 w-[calc(100%-2rem)] mx-auto block py-3 rounded-xl bg-garden-mascot text-white font-bold text-sm hover:bg-[#7A9538] active:scale-95 transition-all"
                    onClick={closeNode}
                  >
                    完成
                  </button>
                </div>
              )}

              {/* ── 知识卡片放大预览 ── */}
              {cardZoomed && (
                <div
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                  onClick={() => setCardZoomed(false)}
                >
                  <img
                    src={selectedNode.cardImage}
                    alt={selectedNode.title}
                    className="w-[504px] max-w-[85vw] rounded-2xl shadow-2xl animate-in"
                  />
                  <p className="absolute bottom-6 inset-x-0 text-center text-white/80 text-sm">点击任意处关闭</p>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
