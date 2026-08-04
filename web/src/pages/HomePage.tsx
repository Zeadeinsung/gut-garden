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

const STAGE_NAMES = ['种子', '幼苗', '成长', '丰收', '大师', '终极']
const STAGE_ICONS = ['sprout', 'leaf', 'flower', 'apple', 'tree', 'trophy']

const KINGKONGS = [
  { id: 'kingkong1', path: '/garden', label: '探索花园', icon: 'leaf', desc: '照顾小居民\n让花园更繁荣', scene: 'from-green-100 to-green-50', arrow: '#4E6A3E', img: '/assets/ui/ui_kingkong_garden.png' },
  { id: 'kingkong2', path: '/checkin', label: '每日打卡', icon: 'checkCircle', desc: '完成健康任务\n培养好习惯', scene: 'from-orange-100 to-orange-50', arrow: '#F39C5B', img: '/assets/ui/ui_kingkong_checkin.png' },
  { id: 'kingkong3', path: '/classroom', label: '知识课堂', icon: 'book', desc: '有趣的肠道知识\n边玩边学', scene: 'from-blue-100 to-blue-50', arrow: '#5BA8F3', img: '/assets/ui/ui_kingkong_class.png' },
  { id: 'kingkong4', path: '/badges', label: '成长徽章', icon: 'trophy', desc: '解锁成就徽章\n见证成长', scene: 'from-purple-100 to-purple-50', arrow: '#9B6AB3', img: '/assets/ui/ui_kingkong_badges.png' },
]

const AI_QUESTIONS = ['🍎 今天吃了什么？', '💩 便便颜色正常吗？', '🌱 如何改善便秘？']

// Default positions from JSON spec (offset by header height: 72px)
// Canvas is 1280 wide; scroll area ends ~710px (header 72 + dock 68).
const HOME_DEFAULTS: Record<string, BlockPos> = {
  tasksCard:  { x: 16,  y: 16,  w: 232, h: 360 },
  tipCard:    { x: 16,  y: 392, w: 232, h: 96 },
  badgePanel: { x: 16,  y: 504, w: 232, h: 96 },
  mascot:     { x: 380, y: 16,  w: 340, h: 200 },
  heroCTA:    { x: 420, y: 238, w: 260, h: 170 },
  aiPanel:    { x: 1032, y: 16, w: 248, h: 540 },
  kingkong1:  { x: 260, y: 430, w: 181, h: 198 },
  kingkong2:  { x: 453, y: 430, w: 181, h: 198 },
  kingkong3:  { x: 646, y: 430, w: 181, h: 198 },
  kingkong4:  { x: 839, y: 430, w: 181, h: 198 },
  progress:   { x: 264, y: 636, w: 752, h: 64 },
}

function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HomePage() {
  const navigate = useNavigate()
  const setStoolModalOpen = useUIStore((s) => s.setStoolModalOpen)
  const setAiChatOpen = useUIStore((s) => s.setAiChatOpen)
  const { user } = useAuthStore()
  const { today, streak } = useCheckinStore()
  const { gardenLevel, moistureLevel, currentState, interactionCount } = useGardenStore()

  const { editing, containerRef, pos, handleMove, handleResize, handleReset } = useEditorPage('home', HOME_DEFAULTS, {
    init: (merged) => {
      // Auto-sync kingkong2/3/4 size to match kingkong1
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
  const todayKey = getTodayKey()
  const doneCount =
    today && today.date === todayKey
      ? today.tasks.filter((t) => t.status === 'done' || t.status === 'makeup').length
      : 0
  const stageIndex = Math.min(gardenLevel - 1, STAGE_NAMES.length - 1)

  const TASK_LIST = [
    { icon: 'leaf', label: '探索花园' },
    { icon: 'salad', label: '健康饮食' },
    { icon: 'moon', label: '优质睡眠' },
    { icon: 'droplet', label: '补充水分' },
    { icon: 'footprints', label: '活力运动' },
  ]

  return (
    <div className="flex flex-col h-full relative">

      <Header
        transparent
        leftSlot={
          <div className="flex items-center gap-2">
            <img src="/assets/ui/ui_logo.png" alt="Gut Garden 肠道花园" className="h-9 object-contain" />
          </div>
        }
        centerSlot={
          <div>
            <h1 className="text-base font-bold text-garden-forest leading-tight">
              欢迎回来，{childName}！👋
            </h1>
            <p className="text-xs text-gray-400">你的肠道花园正在茁壮成长</p>
          </div>
        }
        userSlot={
          <div className="flex items-center gap-1">
            <span className="w-7 h-7 rounded-full bg-garden-sky flex items-center justify-center overflow-hidden">
              {user?.children.find((c) => c.id === user.active_child_id)?.avatar_url ? (
                <img
                  src={user.children.find((c) => c.id === user.active_child_id)!.avatar_url!}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <img src="/assets/ui/ui_avatar_default_child.png" alt="" className="w-full h-full rounded-full object-cover" />
              )}
            </span>
            <span className="text-[10px] font-semibold text-garden-forest bg-green-100 px-1.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
              <UiIcon name="sprout" size={12} />
              Lv.{gardenLevel} {STAGE_NAMES[stageIndex]}阶段
            </span>
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
        {/* Left column — 花园状态 + 小贴士 + 阶段 */}
        <DraggableBlock
          blockId="tasksCard" defaultPos={pos('tasksCard')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="glass-card p-4 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg flex items-center text-gray-500"><UiIcon name="clipboard" size={17} /></span>
                <h3 className="font-bold text-sm text-garden-forest">今日任务</h3>
              </div>
              <span className="text-xs font-bold text-garden-forest bg-green-100 px-2 py-0.5 rounded-full">
                {doneCount}/5
              </span>
            </div>

            <ProgressBar value={doneCount} max={5} color="bg-garden-forest" />

            <div className="flex-1 flex flex-col justify-center gap-1.5 py-2">
              {TASK_LIST.map((t, i) => {
                const done = i < doneCount
                return (
                  <div
                    key={t.label}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${
                      done ? 'bg-green-50' : 'bg-white/70 border border-white/80'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      done ? 'bg-green-500 text-white' : 'bg-gray-100'
                    }`}>
                      {done ? <UiIcon name="check" size={11} /> : <UiIcon name={t.icon} size={11} className="opacity-40 grayscale" />}
                    </span>
                    <span className={`text-xs ${done ? 'text-green-600 line-through' : 'text-gray-600'}`}>
                      {t.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Status chips */}
            <div className="border-t border-white/60 pt-2 flex justify-around">
              {[
                { icon: 'droplet', label: '水分充足', on: moistureLevel >= 40 },
                { icon: 'sprout', label: '菌群活跃', on: currentState !== 'dry' },
                { icon: 'shield', label: '屏障稳固', on: currentState !== 'high_sugar' },
              ].map((m) => (
                <span key={m.label} className="flex items-center gap-1 rounded-full px-2 py-0.5 bg-white/70 whitespace-nowrap">
                  <UiIcon name={m.icon} size={12} className={m.on ? '' : 'opacity-40 grayscale'} />
                  <span className={`text-[9px] ${m.on ? 'text-gray-500' : 'text-gray-300'}`}>{m.label}</span>
                </span>
              ))}
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock
          blockId="tipCard" defaultPos={pos('tipCard')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="glass-card p-4 h-full">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base flex items-center"><UiIcon name="lightbulb" size={15} className="text-amber-500" /></span>
              <h3 className="font-bold text-xs text-garden-forest">今日小贴士</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">多吃蔬菜和水果，帮助益生菌茁壮成长哦！</p>
          </div>
        </DraggableBlock>

        {/* Center — 吉祥物 + 扫描球体 */}
        <DraggableBlock
          blockId="mascot" defaultPos={pos('mascot')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="relative flex items-center justify-center h-full">
            <div className="absolute -top-1 left-4 bg-white rounded-2xl rounded-bl-sm px-3 py-1.5 text-xs text-gray-600 shadow-md z-10">
              今天一起照顾小居民吧！❤️
            </div>
            <img
              src="/assets/characters/lottie/char_xiaoyuan_idle.png"
              alt="菌小园"
              className="h-[78%] object-contain drop-shadow-lg animate-bounce-slow"
            />
          </div>
        </DraggableBlock>

        <DraggableBlock
          blockId="heroCTA" defaultPos={pos('heroCTA')}
          editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="relative h-full flex items-center justify-center">
            <span className="absolute top-1 right-1 bg-garden-coral/90 text-white text-[9px] px-2 py-0.5 rounded-full font-medium z-10">
              推荐 每日一次
            </span>
            <button
              className="relative w-[126px] h-[126px] rounded-full text-white flex flex-col items-center justify-center gap-0.5 hover:scale-105 active:scale-95 transition-transform"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #FFD9A0 0%, #FFB074 25%, #F38D83 55%, #E0707A 100%)',
                boxShadow:
                  '0 14px 34px rgba(243, 141, 131, 0.45), inset 0 -8px 18px rgba(0,0,0,0.14), inset 0 5px 12px rgba(255,255,255,0.5)',
              }}
              onClick={() => setStoolModalOpen(true)}
            >
              <UiIcon name="camera" size={26} className="text-white" />
              <span className="font-bold text-xs leading-tight mt-0.5">今日肠道扫描</span>
              <span className="text-[9px] text-white/85 leading-tight px-3 text-center">拍便便 · AI分析</span>
            </button>
          </div>
        </DraggableBlock>

        {/* Bottom feature cards */}
        {KINGKONGS.map((kk) => (
          <DraggableBlock
            key={kk.id}
            blockId={kk.id}
            defaultPos={pos(kk.id)}
            editing={editing}
            containerRef={containerRef}
            onMove={handleMove} onResize={handleResize}
          >
            <button
              className="glass-card flex flex-col w-full h-full p-3 hover:shadow-md hover:scale-[1.02] transition-all active:scale-95"
              onClick={() => navigate(kk.path)}
            >
              {/* Top: 3D scene illustration */}
              <div className={`w-full flex-1 min-h-0 rounded-2xl bg-gradient-to-b ${kk.scene} flex items-center justify-center relative overflow-hidden`}>
                {kk.img ? (
                  <img src={kk.img} alt={kk.label} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <>
                    <span className="absolute top-1.5 left-2 text-[10px] opacity-60 text-amber-400"><UiIcon name="sparkles" size={12} /></span>
                    <span className="text-4xl drop-shadow-md"><UiIcon name={kk.icon} size={38} /></span>
                    <span className="absolute bottom-1.5 right-2 text-[10px] opacity-60 text-green-500"><UiIcon name="leaf" size={12} /></span>
                  </>
                )}
              </div>
              {/* Bottom: title + desc + arrow */}
              <div className="flex items-center justify-between gap-1 mt-2">
                <div className="text-left min-w-0">
                  <span className="block font-bold text-sm text-gray-700 leading-tight">{kk.label}</span>
                  <span className="block text-[9px] text-gray-400 leading-relaxed mt-0.5 whitespace-pre-line">{kk.desc}</span>
                </div>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0"
                  style={{ background: kk.arrow }}
                >
                  →
                </span>
              </div>
            </button>
          </DraggableBlock>
        ))}

        {/* 花园成长进度（替代花园阶段） */}
        <DraggableBlock
          blockId="badgePanel" defaultPos={pos('badgePanel')}
          editing={editing} movable
          containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="glass-card p-3 h-full flex flex-col justify-center gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">花园成长进度</span>
              <span className="text-xs font-bold text-garden-forest">
                已成长 <span className="text-garden-gold">{streak}</span> 天
              </span>
            </div>
            <div className="flex items-center justify-between">
              {STAGE_NAMES.map((name, i) => {
                const unlocked = i <= stageIndex
                const isCurrent = i === stageIndex
                return (
                  <div key={name} className="flex flex-col items-center gap-0.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        unlocked ? 'bg-garden-forest text-white' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {unlocked ? <UiIcon name={STAGE_ICONS[i]} size={11} /> : <UiIcon name="lock" size={11} />}
                    </span>
                    <span className={`text-[8px] leading-none ${isCurrent ? 'text-garden-forest font-bold' : unlocked ? 'text-green-600' : 'text-gray-300'}`}>
                      {name}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="text-right">
              <span className="text-[9px] text-gray-400">下一阶段奖励：</span>
              <span className="text-[10px] font-bold text-garden-forest inline-flex items-center gap-1">神秘菌屋 <UiIcon name="house" size={12} /></span>
            </div>
          </div>
        </DraggableBlock>

        {/* Right panel — 菌小园助手 */}
        <DraggableBlock
          blockId="aiPanel" defaultPos={pos('aiPanel')}
          editing={editing} movable resizable
          containerRef={containerRef} onMove={handleMove} onResize={handleResize}
        >
          <div className="glass-card p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-garden-cream flex items-center justify-center shadow-inner">
                  <UiIcon name="bot" size={18} className="text-garden-forest" />
                </span>
                <h3 className="font-bold text-sm text-garden-forest">菌小园助手</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="bg-garden-cream rounded-xl rounded-bl-sm p-3 mb-2">
                <p className="text-xs text-gray-500">嗨！我是你的AI菌小园助手~</p>
              </div>
              <div className="bg-white/70 rounded-xl rounded-bl-sm p-3 mb-3">
                <p className="text-xs text-gray-500">今天想了解什么呢？</p>
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                {AI_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="text-xs text-left text-gray-600 hover:text-garden-forest bg-white/60 rounded-lg px-3 py-2 hover:bg-white/90 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                className="w-full py-2 bg-garden-forest text-white rounded-xl text-xs font-bold hover:bg-[#3d5530] active:scale-95 transition-all"
                onClick={() => setAiChatOpen(true)}
              >
                和我聊天
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/60 text-xs shrink-0">
              <p className="font-bold text-gray-500 mb-1.5 inline-flex items-center gap-1"><UiIcon name="chart" size={13} />今日观察</p>
              <ul className="text-[11px] text-gray-400 space-y-1">
                <li className="inline-flex items-center gap-1"><UiIcon name="droplet" size={11} className="text-sky-500" />连续 {streak} 天喝水达标</li>
                <li className="inline-flex items-center gap-1"><UiIcon name="tree" size={11} className="text-green-500" />蔬菜摄入稍少，建议多吃深色蔬菜</li>
                <li className="inline-flex items-center gap-1"><UiIcon name="handshake" size={11} className="text-amber-500" />今日互动 {interactionCount} 次</li>
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
