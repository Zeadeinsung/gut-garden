import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useGardenStore } from '@/stores/gardenStore'
import { useCheckinStore } from '@/stores/checkinStore'
import { useBadgeStore } from '@/stores/badgeStore'
import { useClassroomStore } from '@/stores/classroomStore'
import { useAuth } from '@/providers/AuthProvider'
import { api } from '@/lib/api'
import { isRegistered } from '@/hooks/useApiSync'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import Header from '@/components/navigation/Header'
import { UiIcon } from '@/lib/uiIcons'
import HistoryChart, { type HistoryPoint } from '@/components/profile/HistoryChart'
import { MOCK_PROFILE } from '@/lib/mockProfile'
import '@/styles/profile-dashboard.css'

type HistoryTab = 'stool' | 'learn'

interface WeeklyReport {
  stool_count: number
}

interface HistorySeries {
  stool: HistoryPoint[]
  learn: HistoryPoint[]
}

interface HistoryApi {
  history: HistorySeries
  total_days: number
  longest_streak: number
}

interface FriendItem {
  name: string
  emoji: string
  color: string
  level: number
  status: string
  energy: number
}

/* ─────────────────────────────────────────────
   阶段 / 经验换算（与后端 STAGE_REQS 对齐的展示层辅助）
   ───────────────────────────────────────────── */

const STAGE_NAMES = ['种子', '幼苗', '成长', '丰收', '大师', '终极']
const XP_CAPS = [0, 60, 150, 300, 600, 1200]

function xpPctOf(xp: number, level: number): number {
  const cap = XP_CAPS[level] ?? XP_CAPS[XP_CAPS.length - 1]
  const prev = XP_CAPS[level - 1] ?? 0
  return Math.min(100, Math.round(((xp - prev) / Math.max(1, cap - prev)) * 100))
}

function nextMilestone(streak: number): number {
  const steps = [7, 14, 21, 30, 60, 100]
  return steps.find((s) => s > streak) ?? steps[steps.length - 1]
}

/* ─────────────────────────────────────────────
   编辑模式坐标（REF 1920×1020 画布，普通模式换算为百分比）
   ───────────────────────────────────────────── */

const REF_W = 1920
const REF_H = 1020
const PROFILE_REF = { w: REF_W, h: REF_H }

const pLeft = (x: number) => `${((x / REF_W) * 100).toFixed(2)}%`
const pTop = (y: number) => `${((y / REF_H) * 100).toFixed(2)}%`
const pWidth = (w: number) => `${((w / REF_W) * 100).toFixed(2)}%`
const pHeight = (h: number) => `${((h / REF_H) * 100).toFixed(2)}%`

const PROFILE_DEFAULTS: Record<string, BlockPos> = {
  profileCard:        { x: 80,   y: 16,   w: 960, h: 150 },
  stats:              { x: 80,   y: 178,  w: 960, h: 260 },
  history:            { x: 80,   y: 450,  w: 960, h: 340 },
  weeklyStats:        { x: 1060, y: 16,   w: 420, h: 150 },
  friends:            { x: 1060, y: 178,  w: 420, h: 300 },
  goal:               { x: 1060, y: 490,  w: 420, h: 150 },
  settingsShortcuts:  { x: 1060, y: 652,  w: 420, h: 170 },
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, mode } = useAuthStore()
  const { readingLevel, soundEnabled, setReadingLevel, setSoundEnabled } = useUIStore()
  const { logout } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAge, setNewAge] = useState(6)
  const [historyTab, setHistoryTab] = useState<HistoryTab>('stool')
  const { editing, containerRef, pos, handleMove, handleResize } = useEditorPage('profile', PROFILE_DEFAULTS)

  const mock = MOCK_PROFILE
  const childId = user?.active_child_id
  const registered = mode === 'registered' && !!childId

  /* ── 真实数据：zustand 各 store（由 useApiSync 在登录后同步） ── */
  const checkinStreak = useCheckinStore((s) => s.streak)
  const { gardenLevel, gardenXp, stageLabel } = useGardenStore()
  const badgeCount = useBadgeStore((s) => s.awarded.length)
  const badgeTotal = useBadgeStore((s) => s.defs.length)
  const knowledge = useClassroomStore((s) => s.modules.reduce((a, m) => a + (m.stars ?? 0), 0))

  /* ── 接口数据：便便计数 / 历史曲线 / 总天数 / 最长连续 ── */
  const [stoolCount, setStoolCount] = useState(() => (registered ? 0 : mock.stool))
  const [historySeries, setHistorySeries] = useState<HistorySeries>(() =>
    registered ? { stool: [], learn: [] } : mock.history
  )
  const [totalDays, setTotalDays] = useState(() => (registered ? 0 : mock.interactionDays))
  const [maxStreak, setMaxStreak] = useState(() => (registered ? 0 : mock.streak))
  const [friends, setFriends] = useState<FriendItem[]>(() => (registered ? [] : mock.friends))

  useEffect(() => {
    if (!registered) return
    api
      .get<WeeklyReport>(`/report/weekly?child_id=${childId}`)
      .then((r) => { if (r && typeof r.stool_count === 'number') setStoolCount(r.stool_count) })
      .catch(() => {})
    api
      .get<HistoryApi>(`/report/history?child_id=${childId}&days=7`)
      .then((r) => {
        if (r?.history) setHistorySeries(r.history)
        if (typeof r.total_days === 'number') setTotalDays(r.total_days)
        if (typeof r.longest_streak === 'number') setMaxStreak(r.longest_streak)
      })
      .catch(() => {})
  }, [registered, childId])

  /* ── 好友 ── */
  useEffect(() => {
    if (!registered) return
    api
      .get<FriendItem[]>(`/friends?child_id=${childId}`)
      .then((r) => { if (Array.isArray(r)) setFriends(r) })
      .catch(() => {})
  }, [registered, childId])

  const activeChild = user?.children.find((c) => c.id === user.active_child_id)

  /* ── 展示值：注册用户用真实数据，游客回退演示数据 ── */
  const display = registered
    ? {
        level: gardenLevel,
        stage: stageLabel || STAGE_NAMES[gardenLevel - 1] || '',
        xp: gardenXp,
        xpPct: xpPctOf(gardenXp, gardenLevel),
        streak: maxStreak,
        badges: badgeCount,
        badgesTotal: Math.max(badgeTotal, badgeCount),
        knowledge,
        stool: stoolCount,
        interactionDays: totalDays,
      }
    : mock

  const historyData: HistoryPoint[] = historySeries[historyTab]
  const historyUnit = historyTab === 'stool' ? '次' : '题'

  const stoolTrend = historySeries.stool.map((h) => h.value)
  const stoolTrendMax = Math.max(...stoolTrend, 1)

  const goalTarget = registered ? nextMilestone(checkinStreak) : mock.goal.target
  const goalProgress = registered ? checkinStreak : mock.goal.progress

  /* ── 六宫格成长数据 ── */
  const growth = [
    {
      icon: 'flame', value: `${display.streak}`, unit: '天', label: '最长连续',
      sub: <span />,
    },
    {
      icon: 'trophy', value: `${display.badges}/${display.badgesTotal}`, unit: '', label: '徽章收集',
      sub: (
        <div className="gdp-progress w-[74px] mt-1.5">
          <div style={{ width: `${display.badgesTotal ? (display.badges / display.badgesTotal) * 100 : 0}%` }} />
        </div>
      ),
    },
    {
      icon: 'book', value: `${display.knowledge}`, unit: '个', label: '知识探索',
      sub: <span />,
    },
    {
      icon: 'clipboard', value: `${display.stool}`, unit: '次', label: '便便记录',
      sub: (
        <div className="gdp-trend">
          {stoolTrend.map((h, i) => (
            <i key={i} style={{ height: Math.max(3, Math.round((h / stoolTrendMax) * 8)) }} />
          ))}
        </div>
      ),
    },
    {
      icon: 'house', value: `第${display.level}·${display.stage}`, unit: '', label: '花园阶段',
      sub: (
        <div className="flex items-center gap-0.5 mt-1.5 text-[12px] leading-none">
          <UiIcon name="sprout" size={12} className="text-[#6a9f3d]" />
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={i < display.level - 1 ? 'text-[#F2B632]' : 'text-[#d8d2bd]'}>★</span>
          ))}
        </div>
      ),
    },
    {
      icon: 'starGold', value: `${display.xp}`, unit: 'XP', label: '总经验值',
      sub: (
        <div className="gdp-progress w-[74px] mt-1.5">
          <div style={{ width: `${display.xpPct}%` }} />
        </div>
      ),
    },
  ]

  /* ── 我的统计（真实数据） ── */
  const statSummary = registered
    ? [
        { key: 'streak', label: '连续打卡', value: maxStreak, unit: '天' },
        { key: 'badges', label: '徽章', value: badgeCount, unit: '枚' },
        { key: 'knowledge', label: '知识问答', value: knowledge, unit: '题' },
      ]
    : mock.statSummary

  /* ── 编辑块渲染：普通模式用百分比定位，编辑模式用 DraggableBlock ── */
  const renderBlock = (id: string, movable: boolean, resizable: boolean, children: ReactNode) => {
    if (editing) {
      return (
        <DraggableBlock
          blockId={id}
          defaultPos={pos(id)}
          editing
          movable={movable}
          resizable={resizable}
          containerRef={containerRef}
          refSize={PROFILE_REF}
          onMove={handleMove}
          onResize={handleResize}
        >
          {children}
        </DraggableBlock>
      )
    }
    const p = pos(id)
    return (
      <div className="absolute" style={{ left: pLeft(p.x), top: pTop(p.y), width: pWidth(p.w), height: pHeight(p.h) }}>
        {children}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        leftSlot={
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-full bg-garden-mascot text-white shadow-md hover:bg-[#7A9538] active:scale-95 transition-all flex items-center justify-center"
              onClick={() => navigate('/')}
              title="返回首页"
            >
              <UiIcon name="chevronLeft" size={20} />
            </button>
            <span className="font-bold text-lg text-garden-forest">我的主页</span>
          </div>
        }
      />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium flex items-center justify-center gap-3 shrink-0">
          <span>Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit</span>
          <button className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[11px] transition-colors" onClick={() => {
            localStorage.removeItem('gg-block-positions-profile')
            window.location.reload()
          }}>
            Reset All
          </button>
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative min-h-0">

        {/* 身份卡 */}
        {renderBlock('profileCard', true, true, (
          <div className="gdp-card h-full flex items-center px-7 py-4">
            <div className="relative shrink-0 mr-5">
              <div className="w-[90px] h-[90px] rounded-full border-[4px] border-[#FFF7DE] bg-gradient-to-br from-[#d9eef8] to-[#b9d9ec] shadow-[0_6px_14px_rgba(70,100,45,0.22)] flex items-center justify-center overflow-hidden">
                {activeChild?.avatar_url ? (
                  <img src={activeChild.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <img src="/assets/ui/ui_avatar_default_child.webp" alt="" className="w-full h-full rounded-full object-cover" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#EAF5D8] border-2 border-white flex items-center justify-center shadow">
                <UiIcon name="sprout" size={15} className="text-[#6a9f3d]" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[26px] font-bold text-[#4B5138] leading-none">{activeChild?.name ?? mock.name}</h2>
              <p className="text-[15px] text-[#8A927D] mt-1.5">
                <span className="font-bold text-[#5E973C]">Lv.{display.level}</span> 肠道小园丁
              </p>
              <p className="text-[13px] text-[#8A927D] mt-1">
                已照顾花园 <strong className="text-[#65A13E] font-bold">{display.interactionDays} 天</strong>
              </p>
            </div>

            <button className="shrink-0 inline-flex items-center gap-1 text-[#3F6D2A] text-[13px] font-semibold hover:opacity-70 transition-opacity">
              <UiIcon name="pen" size={14} /> 编辑
            </button>
          </div>
        ))}

        {/* 六宫格成长数据 */}
        {renderBlock('stats', true, true, (
          <div className="gdp-card h-full grid grid-cols-3 grid-rows-2 overflow-hidden">
            {growth.map((g, i) => (
              <div
                key={g.label}
                className={`flex flex-col items-center justify-center px-3 ${i % 3 ? 'border-l border-[rgba(100,120,70,0.08)]' : ''} ${i >= 3 ? 'border-t border-[rgba(100,120,70,0.08)]' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <UiIcon name={g.icon} size={20} />
                  <strong className="text-[24px] font-extrabold text-[#3F3B2D] leading-none">
                    {g.value}
                    {g.unit && <small className="text-[12px] font-bold text-[#8A927D] ml-0.5">{g.unit}</small>}
                  </strong>
                </div>
                <div className="text-[12px] text-[#858875] font-semibold mt-1">{g.label}</div>
                {g.sub}
              </div>
            ))}
          </div>
        ))}

        {/* 历史记录 */}
        {renderBlock('history', true, true, (
          <div className="gdp-card h-full flex flex-col px-5 py-3.5 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="gdp-title flex items-center gap-1.5">
                <UiIcon name="clipboard" size={15} className="text-[#6a9f3d]" /> 历史记录
              </h3>
              <div className="flex gap-1 bg-white/50 rounded-full p-0.5 border border-white/70">
                {(['stool', 'learn'] as HistoryTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setHistoryTab(t)}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                      historyTab === t
                        ? 'bg-[#6BAE3D] text-white shadow-[0_2px_6px_rgba(107,174,61,0.4)]'
                        : 'text-[#8A8B79] hover:text-[#4a4638]'
                    }`}
                  >
                    {t === 'stool' ? '便便' : '学习'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 mt-1 relative">
              <HistoryChart data={historyData} unit={historyUnit} />
            </div>

            <div className="shrink-0 flex items-center justify-between px-1 mt-0.5">
              <span className="text-[11px] text-[#9aa38d] flex items-center gap-1">
                <UiIcon name="leaf" size={12} /> 小植物
              </span>
              <span className="text-[11px] text-[#9aa38d] flex items-center gap-1">
                <UiIcon name="flower" size={12} /> 小花
              </span>
            </div>
          </div>
        ))}

        {/* 我的统计 */}
        {renderBlock('weeklyStats', true, true, (
          <div className="gdp-card h-full flex flex-col px-5 py-3.5">
            <h3 className="gdp-title flex items-center gap-1.5">
              <UiIcon name="chart" size={15} className="text-[#6a9f3d]" /> 我的统计
            </h3>
            <div className="flex-1 flex items-stretch mt-1">
              {statSummary.map((s, i) => (
                <div
                  key={s.key}
                  className={`flex-1 flex flex-col items-center justify-center text-center ${i ? 'border-l border-[rgba(100,120,70,0.10)]' : ''}`}
                >
                  <div className="gdp-num">{s.value}<small>{s.unit}</small></div>
                  <div className="gdp-label mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 好友 */}
        {renderBlock('friends', true, true, (
          <div className="gdp-card h-full flex flex-col px-5 py-3.5">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="gdp-title flex items-center gap-1.5">
                <UiIcon name="users" size={15} className="text-[#6a9f3d]" /> 好友
              </h3>
              <button className="text-[11px] text-[#8A8B79] hover:text-[#4a4638] flex items-center gap-0.5 transition-colors">
                查看更多 <UiIcon name="chevronRight" size={12} />
              </button>
            </div>
            <div className="flex-1 min-h-0 mt-1 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-center text-[12px] text-[#9aa38d] py-6">还没有好友，去认识新朋友吧～</p>
              ) : (
                friends.map((f, i) => (
                  <div key={f.name} className={`flex items-center gap-3 py-1 shrink-0 ${i ? 'border-t border-[rgba(100,120,70,0.08)]' : ''}`}>
                    <div className="gdp-friend-avatar" style={{ background: `linear-gradient(180deg, ${f.color}, ${f.color}CC)` }}>
                      {f.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-bold text-[#3F3B2D]">{f.name}</span>
                        <span className="text-[11px] font-bold text-[#5E973C]">Lv.{f.level}</span>
                      </div>
                      <p className="text-[12px] text-[#8C8C7B] truncate">{f.status}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <UiIcon name="leaf" size={14} className="text-[#679D3D]" />
                      <span className="text-[18px] font-extrabold text-[#679D3D] leading-none">{f.energy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* 当前目标 */}
        {renderBlock('goal', true, true, (
          <div className="gdp-card h-full flex flex-col px-5 py-3.5">
            <h3 className="gdp-title flex items-center gap-1.5">
              <UiIcon name="target" size={15} className="text-[#6a9f3d]" /> 当前目标
            </h3>
            <div className="flex-1 flex flex-col justify-center mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#3F3B2D]">连续打卡 {goalTarget} 天</span>
                <span className="text-[13px] font-extrabold text-[#5E973C]">{goalProgress}/{goalTarget} 天</span>
              </div>
              <div className="gdp-progress mt-2" style={{ height: 9 }}>
                <div style={{ width: `${goalTarget ? (goalProgress / goalTarget) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[11px] text-[#858875]">完成可获得</span>
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#C98A2D]">
                  <UiIcon name="gift" size={15} /> {mock.reward}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* 阅读模式 + 音效 + 登录 */}
        {renderBlock('settingsShortcuts', true, true, (
          <div className="gdp-card divide-y divide-[rgba(100,120,70,0.08)] h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-2.5">
              <span className="text-[13px] text-[#5e5a48] font-semibold">阅读模式</span>
              <div className="flex gap-1 bg-white/60 rounded-full p-0.5">
                {(['child', 'parent'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                      readingLevel === lvl ? 'bg-white text-garden-forest shadow-sm' : 'text-[#9a9586]'
                    }`}
                    onClick={() => setReadingLevel(lvl)}
                  >
                    {lvl === 'child' ? <UiIcon name="baby" size={15} /> : <UiIcon name="users" size={15} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-2.5">
              <span className="text-[13px] text-[#5e5a48] font-semibold">音效</span>
              <button
                className="w-10 h-6 rounded-full transition-colors"
                style={{ background: soundEnabled ? '#8AB83F' : '#cfcfc4' }}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                <div
                  className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
                  style={{ transform: soundEnabled ? 'translateX(20px)' : 'translateX(2px)' }}
                />
              </button>
            </div>
            <div className="px-5 py-2">
              {mode === 'guest' ? (
                <Button variant="primary" size="sm" className="w-full text-xs" onClick={() => navigate('/login')}>
                  注册/登录
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="w-full text-xs text-red-500 hover:bg-red-50" onClick={() => { logout(); navigate('/login') }}>
                  退出登录
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add child modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="添加宝宝">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">名字</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:border-garden-forest"
              placeholder="宝宝的名字"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">年龄</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:border-garden-forest"
              type="number" min={0} max={18} value={newAge}
              onChange={(e) => setNewAge(Number(e.target.value))}
            />
          </div>
          <Button
            variant="primary" className="w-full"
            onClick={() => {
              if (!newName.trim()) return
              const store = useAuthStore.getState()

              const addChild = (newChild: { id: number; name: string; age: number; avatar_url: string | null }) => {
                store.setUser({
                  ...store.user!,
                  children: [...(store.user?.children ?? []), newChild],
                  active_child_id: store.user?.active_child_id ?? newChild.id,
                  parent_id: store.user?.parent_id ?? 0,
                  phone: store.user?.phone ?? '',
                })
                setAddOpen(false)
                setNewName('')
              }

              if (isRegistered()) {
                api
                  .post<{ id: number; name: string; age: number; avatar_url: string | null }>('/children', {
                    nickname: newName.trim(),
                    age: newAge,
                  })
                  .then(addChild)
                  .catch(() => {})
                return
              }

              addChild({ id: Date.now(), name: newName.trim(), age: newAge, avatar_url: null })
            }}
            disabled={!newName.trim()}
          >
            确认添加
          </Button>
        </div>
      </Modal>
    </div>
  )
}
