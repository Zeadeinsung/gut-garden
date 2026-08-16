import { useNavigate } from 'react-router-dom'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import FoodToolbar from '@/components/garden/FoodToolbar'
import { useFeedLogic } from '@/hooks/useFeedLogic'
import { useGardenStore } from '@/stores/gardenStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { useUIStore } from '@/stores/uiStore'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import { savePositions } from '@/hooks/useEditMode'
import Header from '@/components/navigation/Header'
import { UiIcon } from '@/lib/uiIcons'

const LEVEL_NAMES: Record<number, string> = {
  1: '种子萌芽',
  2: '幼苗成长',
  3: '茁壮生长',
  4: '花繁叶茂',
  5: '硕果累累',
  6: '参天大树',
}

const IMPACTS = [
  { icon: 'saladLine', label: '蔬菜摄入', value: '+10', color: 'text-green-600' },
  { icon: 'dropletLine', label: '喝水充足', value: '+5', color: 'text-green-600' },
  { icon: 'candyLine', label: '高糖食物', value: '-8', color: 'text-red-400' },
  { icon: 'moonLine', label: '充足睡眠', value: '+6', color: 'text-green-600' },
  { icon: 'footprintsLine', label: '运动活动', value: '+4', color: 'text-green-600' },
]

const GARDEN_DEFAULTS: Record<string, BlockPos> = {
  statusBar:     { x: 16,  y: 0,   w: 1248, h: 64 },
  gardenStatus:  { x: 16,  y: 80,  w: 232, h: 224 },
  impactFactors: { x: 16,  y: 320, w: 232, h: 312 },
  mascotPanel:   { x: 1032, y: 80, w: 248, h: 540 },
  bottomBar:     { x: 96,  y: 544, w: 920, h: 80 },
  bld_tree:      { x: 600, y: 84,  w: 192, h: 56 },
  bld_resident:  { x: 790, y: 100, w: 192, h: 56 },
  bld_lab:       { x: 790, y: 240, w: 192, h: 56 },
  bld_eco:       { x: 790, y: 400, w: 192, h: 56 },
  bld_plant:     { x: 300, y: 210, w: 192, h: 56 },
  bld_barrier:   { x: 300, y: 360, w: 192, h: 56 },
  bld_stream:    { x: 560, y: 320, w: 192, h: 56 },
}

interface Building {
  id: string
  name: string
  level: number
  desc: string
}

const BUILDINGS: Building[] = [
  { id: 'bld_tree',     name: '生命之树',     level: 4, desc: '为整个花园提供生命能量' },
  { id: 'bld_plant',    name: '植物区',       level: 2, desc: '种植有益植物，喂养菌居民' },
  { id: 'bld_barrier',  name: '肠道屏障城堡', level: 1, desc: '守护城墙，抵御坏菌入侵' },
  { id: 'bld_stream',   name: '溪流区',       level: 2, desc: '水分充足，生态才会舒' },
  { id: 'bld_resident', name: '菌居民之家',   level: 3, desc: '查看你的菌居民和它们的状态' },
  { id: 'bld_lab',      name: '发酵实验室',   level: 2, desc: '食物在这里被转化和发酵' },
  { id: 'bld_eco',      name: '生态观察站',   level: 1, desc: '观察你的生态整理和变化' },
]

/* 地图建筑提示卡片 —— 白底圆角 + 等级胶囊 + 右上角升级气泡 + 右箭头 */
function BuildingCard({ name, level, desc }: { name: string; level: number; desc: string }) {
  return (
    <div className="relative w-full h-full">
      {/* 右上角升级气泡（可升级提示） */}
      <div className="absolute -top-2 -right-1.5 z-20 w-[22px] h-[22px] rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md animate-float">
        <UiIcon name="arrowUp" size={12} />
      </div>
      {/* 卡片主体 */}
      <div className="w-full h-full rounded-xl card-module shadow-[0_5px_16px_rgba(60,90,40,0.16)] px-3 flex flex-col justify-center">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[12px] leading-tight text-[#1C3E20] whitespace-nowrap">{name}</span>
          <span className="px-1.5 py-[2px] rounded-full text-[8px] font-bold leading-none bg-[#FEF3C7] text-[#D97706] whitespace-nowrap">Lv.{level}</span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-[9px] leading-tight text-[#6B7280] truncate">{desc}</span>
          <span className="text-[#1C3E20] font-bold text-[13px] leading-none shrink-0">›</span>
        </div>
      </div>
    </div>
  )
}

function hasStoolToday(): boolean {
  try {
    const saved = localStorage.getItem('gg-stool-logs')
    if (!saved) return false
    const logs = JSON.parse(saved)
    const today = new Date().toISOString().slice(0, 10)
    return logs.some((l: { date: string }) => l.date === today)
  } catch {
    return false
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/* 半圆弧绿色进度环（第2项 生态繁茂度） */
function RingProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <svg viewBox="0 0 36 22" className="w-8 shrink-0" fill="none" aria-hidden="true">
      <path d="M4 18 A 14 14 0 0 1 32 18" stroke="#E5E7EB" strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M4 18 A 14 14 0 0 1 32 18"
        stroke="#16A34A"
        strokeWidth="4.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${pct} 100`}
      />
    </svg>
  )
}

/* 单元格之间的浅色垂直分割线 */
function CellDivider() {
  return <div className="w-px shrink-0" style={{ background: 'rgba(0,0,0,0.06)' }} />
}

export default function GardenPage() {
  const navigate = useNavigate()
  const { handleDrop } = useFeedLogic()
  const { gardenLevel, gardenXp, moistureLevel, currentState } = useGardenStore()
  const checkin = useCheckinStore()
  const setAiChatOpen = useUIStore((s) => s.setAiChatOpen)
  const { editing, containerRef, pos, handleMove, handleResize } = useEditorPage('garden', GARDEN_DEFAULTS, {
    // 旧版存档一次性迁移：顶部区块整体下移，给新增的“状态栏”模块让位
    init: (merged, layoutVersion) => {
      if (layoutVersion === 0 || layoutVersion >= 3) return merged
      const SHIFT = 64
      for (const id of ['gardenStatus', 'impactFactors', 'mascotPanel', 'bld_tree']) {
        const b = merged[id]
        if (b) merged = { ...merged, [id]: { ...b, y: b.y + SHIFT } }
      }
      savePositions('garden', merged)
      return merged
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const onDragEnd = (event: DragEndEvent) => {
    if (editing) return
    const { active, over } = event
    if (over && over.id === 'garden-drop-zone') {
      handleDrop(String(active.id))
    }
  }

  const stateLabel: Record<string, string> = {
    healthy: '生态平衡良好',
    high_sugar: '糖分过高',
    dry: '缺水',
    recovering: '恢复中',
  }

  const healthScore = clamp(Math.round((moistureLevel || 0) * 0.55 + 40), 0, 100)

  const residentCount = Math.floor(gardenXp / 5)
  const levelName = LEVEL_NAMES[gardenLevel] || ''

  const waterDone = checkin.today?.tasks.find((t) => t.id === 'task_water')?.status === 'done'
  const eatDone = checkin.today?.tasks.find((t) => t.id === 'task_eat')?.status === 'done'
  const stoolDone = hasStoolToday()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        transparent
        leftSlot={
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-full bg-garden-mascot text-white shadow-md hover:bg-[#7A9538] active:scale-95 transition-all flex items-center justify-center"
              onClick={() => navigate('/')}
            >
              <UiIcon name="chevronLeft" size={20} />
            </button>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-lg text-garden-forest">探索花园</p>
                <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center leading-none">?</span>
              </div>
              <p className="text-[10px] text-gray-500">我的肠道生态世界</p>
            </div>
          </div>
        }
        centerSlot={null}
        userSlot={null}
        controlsSlot={null}
      />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium">
          Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div ref={containerRef} className="flex-1 relative min-h-0">

        {/* 状态数据栏 — 毛玻璃卡片：横向 4 格平铺（可编辑拖拽/缩放） */}
        <DraggableBlock blockId="statusBar" defaultPos={pos('statusBar')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card card-module h-full flex items-stretch px-2 py-2.5">
            {/* 1. 生态等级 */}
            <div className="flex-1 flex items-center justify-center gap-2.5 px-2 min-w-0">
              <span className="w-10 h-10 rounded-full bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.08)] shrink-0">
                <UiIcon name="sprout" size={22} />
              </span>
              <div className="leading-tight min-w-0">
                <p className="text-[10px] font-medium text-[#556B2F]">生态等级</p>
                <p className="text-[17px] font-bold leading-tight text-[#16A34A] whitespace-nowrap">
                  Lv.{gardenLevel}
                  {levelName && <span className="ml-1 text-[10px] font-normal text-gray-400">{levelName}</span>}
                </p>
              </div>
            </div>

            <CellDivider />

            {/* 2. 生态繁茂度 */}
            <div className="flex-1 flex items-center justify-center gap-2.5 px-2 min-w-0">
              <span className="w-10 h-10 rounded-full bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.08)] shrink-0">
                <UiIcon name="tree" size={22} />
              </span>
              <div className="leading-tight min-w-0">
                <p className="text-[10px] font-medium text-[#556B2F]">生态繁茂度</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[17px] font-bold leading-tight text-[#1C3E20] whitespace-nowrap">
                    {moistureLevel}<span className="text-[11px] font-medium text-[#9CA3AF]">/100</span>
                  </p>
                  <RingProgress value={moistureLevel} />
                </div>
              </div>
            </div>

            <CellDivider />

            {/* 3. 菌居民数量 */}
            <div className="flex-1 flex items-center justify-center gap-2.5 px-2 min-w-0">
              <span className="w-10 h-10 rounded-full bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.08)] shrink-0">
                <UiIcon name="users" size={20} className="text-blue-500" />
              </span>
              <div className="leading-tight min-w-0">
                <p className="text-[10px] font-medium text-[#556B2F]">菌居民数量</p>
                <p className="text-[17px] font-bold leading-tight text-[#1C3E20] whitespace-nowrap flex items-center gap-1">
                  {residentCount}
                  <span className="inline-flex items-center text-[#16A34A]"><UiIcon name="arrowUp" size={13} /></span>
                </p>
              </div>
            </div>

            <CellDivider />

            {/* 4. 连续照顾 */}
            <div className="flex-1 flex items-center justify-center gap-2.5 px-2 min-w-0">
              <span className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.08)] shrink-0">
                <UiIcon name="calendar" size={20} className="text-[#EA580C]" />
              </span>
              <div className="leading-tight min-w-0">
                <p className="text-[10px] font-medium text-[#556B2F]">连续照顾</p>
                <p className="text-[17px] font-bold leading-tight text-[#EA580C] whitespace-nowrap">
                  {checkin.streak}<span className="text-[11px] font-medium">天</span>
                </p>
              </div>
            </div>
          </div>
        </DraggableBlock>

        {/* Left sidebar — 花园状态 */}
        <DraggableBlock blockId="gardenStatus" defaultPos={pos('gardenStatus')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="rounded-2xl card-module shadow-md p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center text-garden-forest"><UiIcon name="leaf" size={16} /></span>
                <h3 className="font-bold text-sm text-garden-forest">花园状态</h3>
              </div>
              <span className="text-garden-forest text-base leading-none">›</span>
            </div>

            {/* 健康指数环 + 状态 */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
              <div className="relative w-[88px] h-[88px] shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(78,106,62,0.12)" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke="url(#gardenHealthGrad)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(100, Math.max(0, healthScore)) / 100)}`}
                  />
                  <defs>
                    <linearGradient id="gardenHealthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
              <div className="text-center">
                <p className="font-bold text-sm text-garden-forest leading-tight">{stateLabel[currentState] || currentState}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">太棒了！你的花园充满了生命力</p>
              </div>
            </div>

            <button
              className="w-full py-1.5 bg-[#3E8A50] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#357A46] active:scale-95 transition-all shrink-0"
              onClick={() => navigate('/report')}
            >
              查看详情
            </button>
          </div>
        </DraggableBlock>

        {/* Left sidebar — 今日影响因素 */}
        <DraggableBlock blockId="impactFactors" defaultPos={pos('impactFactors')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="rounded-2xl card-module shadow-md p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <span className="flex items-center text-amber-500"><UiIcon name="zap" size={15} /></span>
              <h3 className="font-bold text-sm text-garden-forest">今日影响因素</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {IMPACTS.map((imp) => (
                <div key={imp.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 inline-flex items-center gap-1.5"><UiIcon name={imp.icon} size={13} className={imp.color} />{imp.label}</span>
                  <span className={`font-bold ${imp.color}`}>{imp.value}</span>
                </div>
              ))}
            </div>
            <button className="text-xs text-garden-forest hover:underline mt-auto pt-3 shrink-0">
              查看全部影响 ›
            </button>
          </div>
        </DraggableBlock>

        {/* Right panel — 菌小园助手 */}
        <DraggableBlock blockId="mascotPanel" defaultPos={pos('mascotPanel')} editing={editing} movable resizable containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card card-module p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-inner overflow-hidden"><img src="/assets/characters/png/char_xiaoyuan.png" alt="菌小园助手" className="w-7 h-7 object-contain" /></span>
                <h3 className="font-bold text-sm text-garden-forest">菌小园助手</h3>
              </div>
              <span className="text-gray-400 text-sm"><UiIcon name="megaphone" size={15} /></span>
            </div>

            <div className="flex items-center gap-2.5 mb-3 shrink-0">
              <img src="/assets/characters/png/char_xiaoyuan.png" alt="菌小园" className="w-12 h-12 object-contain shrink-0" />
              <div className="bg-garden-cream rounded-xl rounded-bl-sm p-3 flex-1">
                <p className="text-xs text-gray-500">嗨，小主人！今天的花园看起来生机勃勃呢！</p>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-500 mb-1.5 shrink-0 inline-flex items-center gap-1"><UiIcon name="search" size={13} />我观察到</p>
            <ul className="text-xs text-gray-400 space-y-1.5 mb-3 shrink-0">
              <li className="inline-flex items-center gap-1"><UiIcon name="leaf" size={12} className="text-green-500" />益生菌居民增加了！</li>
              <li className="inline-flex items-center gap-1"><UiIcon name="droplet" size={12} className="text-sky-500" />小溪的水很清澈</li>
              <li className="inline-flex items-center gap-1"><UiIcon name="salad" size={12} className="text-orange-500" />记得多吃蔬菜哦</li>
            </ul>

            <div className="bg-garden-cream rounded-xl p-3 mb-3 shrink-0">
              <p className="text-xs font-bold text-gray-500 mb-1 inline-flex items-center gap-1"><UiIcon name="lightbulb" size={13} className="text-amber-500" />今日小建议</p>
              <p className="text-xs text-gray-500 leading-relaxed">睡前喝杯温水，有助于花园恢复能量！</p>
            </div>

            <button
              className="w-full py-2.5 bg-garden-mascot text-white rounded-xl text-sm font-bold hover:bg-[#7A9538] active:scale-95 transition-all mt-auto shrink-0"
              onClick={() => setAiChatOpen(true)}
            >
              和我聊天
            </button>
          </div>
        </DraggableBlock>

        {/* 地图建筑提示卡片（7 张，可编辑拖拽） */}
        {BUILDINGS.map((b) => (
          <DraggableBlock key={b.id} blockId={b.id} defaultPos={pos(b.id)} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <BuildingCard name={b.name} level={b.level} desc={b.desc} />
          </DraggableBlock>
        ))}

        <DraggableBlock blockId="bottomBar" defaultPos={pos('bottomBar')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card card-module h-full flex items-center gap-3 px-3">
            {/* 左：食物/喂养工具按钮 */}
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <FoodToolbar />
            </div>

            {/* 分隔线 */}
            <div className="w-px h-9 bg-gray-200/80 shrink-0" />

            {/* 右：今日任务 + 完成奖励 */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-xs shrink-0">
                <span className="text-gray-500 font-bold block inline-flex items-center gap-1"><UiIcon name="clipboard" size={13} />今日任务</span>
                <div className="flex gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-0.5 ${waterDone ? 'text-green-600' : 'text-gray-400'}`}>
                    <UiIcon name="droplet" size={11} />浇水 {waterDone ? '1/1' : '0/1'}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 ${stoolDone ? 'text-green-600' : 'text-gray-400'}`}>
                    <UiIcon name="camera" size={11} />便便分析 {stoolDone ? '1/1' : '0/1'}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 ${eatDone ? 'text-green-600' : 'text-gray-400'}`}>
                    <UiIcon name="salad" size={11} />吃蔬菜 {eatDone ? '2/2' : '0/2'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center shrink-0 pl-2 ml-1 border-l border-gray-200/80">
                <span className="text-[9px] text-gray-400">完成奖励</span>
                <span className="text-lg leading-none text-garden-forest my-0.5"><UiIcon name="sprout" size={18} /></span>
                <span className="text-[9px] text-green-600 font-bold">x20 <span className="text-gray-400 font-normal">生态能量</span></span>
              </div>
            </div>
          </div>
        </DraggableBlock>
      </div>
      </DndContext>
    </div>
  )
}
