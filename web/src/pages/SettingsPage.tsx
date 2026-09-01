import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/providers/AuthProvider'
import { DraggableBlock, type BlockPos } from '@/components/ui/DraggableBlock'
import { useEditorPage } from '@/hooks/useEditorPage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import Header from '@/components/navigation/Header'
import { UiIcon } from '@/lib/uiIcons'

function ParentGate({ onPass }: { onPass: () => void }) {
  const [nums] = useState(() => {
    const x = Math.floor(Math.random() * 10) + 1
    const y = Math.floor(Math.random() * 10) + 1
    return { a: x, b: y }
  })
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (parseInt(answer) === nums.a + nums.b) {
      onPass()
    } else {
      setError(true)
      setAnswer('')
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm mx-4 text-center">
        <span className="mb-3 block text-garden-forest"><UiIcon name="lockKeyhole" size={32} /></span>
        <h3 className="font-bold text-garden-forest mb-2">家长验证</h3>
        <p className="text-sm text-gray-400 mb-4">请回答问题以验证您是家长</p>
        <p className="text-xl font-bold text-gray-700 mb-4">
          {nums.a} + {nums.b} = ?
        </p>
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-center text-lg focus:outline-none focus:border-garden-forest mb-3"
          type="number"
          placeholder="输入答案"
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        {error && <p className="text-garden-coral text-xs mb-2">答案不对哦，再试一次～</p>}
        <button
          className="w-full py-2.5 bg-garden-mascot text-white rounded-xl font-bold text-sm"
          onClick={handleSubmit}
        >
          确认
        </button>
      </div>
    </div>
  )
}

const SETTINGS_DEFAULTS: Record<string, BlockPos> = {
  child:     { x: 16, y: 16,  w: 600, h: 150 },
  display:   { x: 16, y: 182, w: 600, h: 110 },
  timelimit: { x: 16, y: 308, w: 600, h: 110 },
  privacy:   { x: 16, y: 434, w: 600, h: 170 },
  account:   { x: 16, y: 566, w: 600, h: 190 },
}

export default function SettingsPage() {
  const { mode, user } = useAuthStore()
  const { readingLevel, soundEnabled, setReadingLevel, setSoundEnabled, setOnboardingComplete } = useUIStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [dailyLimit, setDailyLimit] = useState(30)
  const [resetOpen, setResetOpen] = useState(false)
  const [parentVerified, setParentVerified] = useState(false)
  const { editing, containerRef, pos, handleMove, handleResize } = useEditorPage('settings', SETTINGS_DEFAULTS)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleReset = () => {
    localStorage.clear()
    useAuthStore.getState().logout()
    useUIStore.getState().setOnboardingComplete(false)
    setResetOpen(false)
    navigate('/login')
  }

  const handleRestartGuide = () => {
    localStorage.removeItem('gg-onboarding-done')
    useUIStore.getState().setOnboardingComplete(false)
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        leftSlot={
          <button
            className="flex items-center gap-1 text-gray-500 hover:text-garden-forest transition-colors"
            onClick={() => navigate(-1)}
          >
            <UiIcon name="chevronLeft" size={20} />
            <span className="font-bold text-sm text-garden-forest inline-flex items-center gap-1"><UiIcon name="settings" size={15} /> 设置</span>
          </button>
        }
      />

      {editing && (
        <div className="bg-garden-coral/90 text-white text-xs text-center py-0.5 font-medium">
          Edit Mode — Drag to move · Corner to resize — Ctrl+E to exit
        </div>
      )}

      {!parentVerified && (
        <ParentGate onPass={() => setParentVerified(true)} />
      )}

      <div ref={containerRef} className="flex-1 relative min-h-0">

        <DraggableBlock blockId="child" defaultPos={pos('child')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="baby" size={15} /> 儿童档案</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-garden-sky overflow-hidden">
                <img src="/assets/ui/ui_avatar_default_child.webp" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-700">
                  {user?.children.find((c) => c.id === user.active_child_id)?.name ?? '未设置'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.children.find((c) => c.id === user.active_child_id)?.age ?? '—'} 岁
                </p>
              </div>
              <button
                className="text-xs text-garden-forest hover:underline"
                onClick={() => navigate('/profile')}
              >
                <span className="inline-flex items-center gap-1"><UiIcon name="pen" size={13} /> 编辑</span>
              </button>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="display" defaultPos={pos('display')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">显示</h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">阅读模式</span>
              <div className="flex gap-1 bg-garden-cream rounded-lg p-0.5">
                {(['child', 'parent'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                      readingLevel === lvl
                        ? 'bg-white text-garden-forest shadow-sm'
                        : 'text-gray-400'
                    }`}
                    onClick={() => setReadingLevel(lvl)}
                  >
                    {lvl === 'child' ? <><UiIcon name="baby" size={14} /> 宝宝</> : <><UiIcon name="users" size={14} /> 家长</>}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">音效</span>
              <button
                className={`w-12 h-7 rounded-full transition-colors ${
                  soundEnabled ? 'bg-garden-mascot' : 'bg-gray-300'
                }`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="timelimit" defaultPos={pos('timelimit')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="timer" size={15} /> 使用时长限制</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">每日时长</span>
              <span className="text-sm font-bold text-garden-forest">{dailyLimit} 分钟</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-full accent-garden-mascot"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>10分钟</span>
              <span>60分钟</span>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="privacy" defaultPos={pos('privacy')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="lock" size={15} /> 隐私与数据</h2>
            <div className="flex flex-col gap-2">
              <button className="text-left text-sm text-gray-600 hover:text-garden-forest py-1 inline-flex items-center gap-2">
                <UiIcon name="camera" size={15} className="text-gray-400" /> 照片上传管理
              </button>
              <button className="text-left text-sm text-gray-600 hover:text-garden-forest py-1 inline-flex items-center gap-2">
                <UiIcon name="download" size={15} className="text-gray-400" /> 导出我的数据
              </button>
              <button className="text-left text-sm text-red-400 hover:text-red-600 py-1 inline-flex items-center gap-2">
                <UiIcon name="trash" size={15} className="text-red-400" /> 删除账号
              </button>
            </div>
          </div>
        </DraggableBlock>

        <DraggableBlock blockId="account" defaultPos={pos('account')} editing={editing} containerRef={containerRef} onMove={handleMove} onResize={handleResize}>
          <div className="glass-card p-5 h-full">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 inline-flex items-center gap-1.5"><UiIcon name="user" size={15} /> 账号</h2>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700">
                {mode === 'registered' ? user?.phone || '已绑定' : '游客模式'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full ${
                mode === 'registered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {mode === 'registered' ? '已注册' : '游客'}
              </span>
            </div>
            {mode === 'guest' ? (
              <Button variant="primary" size="sm" className="w-full" onClick={() => navigate('/login')}>
                注册/登录
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full text-red-500 hover:bg-red-50" onClick={handleLogout}>
                退出登录
              </Button>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
              <Button variant="ghost" size="sm" className="w-full text-garden-forest hover:bg-garden-cream" onClick={handleRestartGuide}>
                <span className="inline-flex items-center gap-1"><UiIcon name="sprout" size={14} /> 重新查看新手指南</span>
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-red-400 hover:bg-red-50" onClick={() => setResetOpen(true)}>
                <span className="inline-flex items-center gap-1"><UiIcon name="alert" size={14} /> 重置所有数据</span>
              </Button>
            </div>
          </div>
        </DraggableBlock>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="确认重置">
        <p className="text-gray-500 text-sm mb-6">这将清除所有本地数据，包括打卡记录、花园进度和徽章。此操作不可撤销。</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setResetOpen(false)}>取消</Button>
          <Button variant="primary" className="flex-1 bg-red-500 hover:bg-red-600" onClick={handleReset}>确认重置</Button>
        </div>
      </Modal>
    </div>
  )
}
