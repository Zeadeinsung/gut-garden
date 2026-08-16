import { useEffect, useState } from 'react'
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

type HistoryTab = 'checkin' | 'stool' | 'learn'

interface ReportData {
  stool_count: number
}

const PROFILE_DEFAULTS: Record<string, BlockPos> = {
  profileCard: { x: 16,  y: 16,  w: 1000, h: 130 },
  stat1:       { x: 16,  y: 160, w: 324,  h: 96 },
  stat2:       { x: 354, y: 160, w: 324,  h: 96 },
  stat3:       { x: 692, y: 160, w: 324,  h: 96 },
  stat4:       { x: 16,  y: 268, w: 324,  h: 96 },
  stat5:       { x: 354, y: 268, w: 324,  h: 96 },
  stat6:       { x: 692, y: 268, w: 324,  h: 96 },
  history:     { x: 16,  y: 376, w: 1000, h: 340 },
  weeklyStats:      { x: 1032, y: 16,  w: 248, h: 150 },
  goal:             { x: 1032, y: 182, w: 248, h: 150 },
  friends:          { x: 1032, y: 348, w: 248, h: 210 },
  settingsShortcuts: { x: 1032, y: 574, w: 248, h: 165 },
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, mode } = useAuthStore()
  const { readingLevel, soundEnabled, setReadingLevel, setSoundEnabled } = useUIStore()
  const { gardenLevel, gardenXp, interactionCount } = useGardenStore()
  const { streak } = useCheckinStore()
  const awarded = useBadgeStore((s) => s.awarded.length)
  const { logout } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAge, setNewAge] = useState(6)
  const [historyTab, setHistoryTab] = useState<HistoryTab>('checkin')
  const { editing, containerRef, pos, handleMove, handleResize } = useEditorPage('profile', PROFILE_DEFAULTS)

  const modules = useClassroomStore((s) => s.modules)
  const knowledgeCount = modules.reduce((sum, m) => sum + m.stars, 0)
  const [stoolCount, setStoolCount] = useState(0)
  const childId = user?.active_child_id
  useEffect(() => {
    if (mode !== 'registered' || !childId) return
    api
      .get<ReportData>(`/report/weekly?child_id=${childId}`)
      .then((r) => setStoolCount(r?.stool_count ?? 0))
      .catch(() => {})
  }, [mode, childId])

  const activeChild = user?.children.find((c) => c.id === user.active_child_id)

  const stats = [
    { blockId: 'stat1', label: '最长连续', value: `${streak}天`, icon: 'flame' },
    { blockId: 'stat2', label: '徽章收集', value: `${awarded}/60`, icon: 'trophy' },
    { blockId: 'stat3', label: '知识探索', value: `${knowledgeCount}个`, icon: 'book' },
    { blockId: 'stat4', label: '便便记录', value: `${stoolCount}次`, icon: 'clipboard' },
    { blockId: 'stat5', label: '花园阶段', value: `第${gardenLevel}·成长`, icon: 'house' },
    { blockId: 'stat6', label: '总经验值', value: `${gardenXp} XP`, icon: 'starGold' },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <Header
        leftSlot={
          <button
            className="flex items-center gap-1 text-gray-500 hover:text-garden-forest transition-colors"
            onClick={() => navigate('/')}
          >
            <UiIcon name="chevronLeft" size={20} />
            <span className="font-bold text-sm text-garden-forest">我的主页</span>
          </button>
        }
      />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium">
          Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative min-h-0">

        {/* Profile card */}
        <DraggableBlock blockId="profileCard" defaultPos={pos('profileCard')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-garden-sky flex items-center justify-center shrink-0 overflow-hidden">
                {activeChild?.avatar_url ? (
                  <img src={activeChild.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <img src="/assets/ui/ui_avatar_default_child.png" alt="" className="w-full h-full rounded-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-garden-forest">
                  {activeChild?.name ?? '未设置'}
                </h2>
                <p className="text-sm text-gray-400">Lv.{gardenLevel} 肠道小园丁</p>
                <p className="text-xs text-gray-400 mt-1">
                  已照顾花园 {interactionCount} 天
                </p>
              </div>
              <button className="text-xs text-garden-forest hover:underline shrink-0 inline-flex items-center gap-1">
                <UiIcon name="pen" size={13} /> 编辑
              </button>
            </div>
          </div>
        </DraggableBlock>

        {/* Stats grid: 3×2, each individually draggable */}
        {stats.map((s) => (
          <DraggableBlock key={s.blockId} blockId={s.blockId} defaultPos={pos(s.blockId)} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
            <div className="glass-card p-4 text-center h-full flex flex-col items-center justify-center">
              <span className="text-garden-forest"><UiIcon name={s.icon} size={22} /></span>
              <p className="text-xl font-bold text-garden-forest mt-1">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </DraggableBlock>
        ))}

        {/* History tabs */}
        <DraggableBlock blockId="history" defaultPos={pos('history')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-4 shadow-sm h-full">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 inline-flex items-center gap-1.5"><UiIcon name="clipboard" size={14} /> 历史记录</h3>
            <div className="flex gap-1 bg-garden-cream rounded-lg p-0.5 mb-3 w-fit">
              {([
                { key: 'checkin' as HistoryTab, label: '打卡' },
                { key: 'stool' as HistoryTab, label: '便便' },
                { key: 'learn' as HistoryTab, label: '学习' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    historyTab === tab.key
                      ? 'bg-white text-garden-forest shadow-sm'
                      : 'text-gray-400'
                  }`}
                  onClick={() => setHistoryTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="text-center text-gray-300 text-sm py-8">
              {historyTab === 'checkin' && '打卡历史将在使用中积累...'}
              {historyTab === 'stool' && '便便记录历史将在使用中积累...'}
              {historyTab === 'learn' && '学习历史将在使用中积累...'}
            </div>
          </div>
        </DraggableBlock>

        {/* Right panel blocks */}
        <DraggableBlock blockId="weeklyStats" defaultPos={pos('weeklyStats')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-4 h-full">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 inline-flex items-center gap-1.5"><UiIcon name="chart" size={14} /> 我的统计</h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>连续打卡 {streak} 天</p>
              <p>徽章 {awarded} 枚</p>
              <p>知识问答 {knowledgeCount} 题</p>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="goal" defaultPos={pos('goal')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-4 h-full">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 inline-flex items-center gap-1.5"><UiIcon name="target" size={14} /> 当前目标</h3>
            <p className="text-sm font-bold text-gray-700">连续打卡 10 天</p>
            <div className="mt-1">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-garden-gold rounded-full h-2" style={{ width: `${Math.min((streak / 10) * 100, 100)}%` }} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{Math.min(streak, 10)}/10 天</p>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="friends" defaultPos={pos('friends')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-4 h-full">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 inline-flex items-center gap-1.5"><UiIcon name="users" size={14} /> 好友</h3>
            <p className="text-xs text-gray-300 text-center py-8 inline-flex items-center gap-1">V2 开放 <UiIcon name="construction" size={14} /></p>
          </div>
        </DraggableBlock>

        {/* Settings shortcuts */}
        <DraggableBlock blockId="settingsShortcuts" defaultPos={pos('settingsShortcuts')} editing={editing} movable resizable containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card divide-y divide-gray-100 h-full flex flex-col">
          <div className="flex items-center justify-between p-3">
            <span className="text-xs text-gray-600">阅读模式</span>
            <div className="flex gap-1 bg-garden-cream rounded-lg p-0.5">
              {(['child', 'parent'] as const).map((lvl) => (
                <button
                  key={lvl}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    readingLevel === lvl
                      ? 'bg-white text-garden-forest shadow-sm'
                      : 'text-gray-400'
                  }`}
                  onClick={() => setReadingLevel(lvl)}
                >
                  {lvl === 'child' ? <UiIcon name="baby" size={14} /> : <UiIcon name="users" size={14} />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3">
            <span className="text-xs text-gray-600">音效</span>
            <button
              className={`w-10 h-6 rounded-full transition-colors ${
                soundEnabled ? 'bg-garden-mascot' : 'bg-gray-300'
              }`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          <div className="p-3">
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
        </DraggableBlock>
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
