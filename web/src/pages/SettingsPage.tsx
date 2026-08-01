import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export default function SettingsPage() {
  const { mode, user } = useAuthStore()
  const { readingLevel, soundEnabled, onboardingComplete, setReadingLevel, setSoundEnabled, setOnboardingComplete } = useUIStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [dailyLimit, setDailyLimit] = useState(30)
  const [resetOpen, setResetOpen] = useState(false)

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

  return (
    <div className="flex flex-col h-full pb-20 px-4 overflow-auto">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-garden-forest">设置</h1>
      </div>

      <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
        {/* Account */}
        <div className="bg-white/60 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">账户</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">
                {mode === 'registered' ? user?.phone || '已注册' : '游客模式'}
              </p>
              <p className="text-xs text-gray-400">
                {mode === 'registered' ? '已绑定手机号' : '数据保存在本地浏览器'}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              mode === 'registered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {mode === 'registered' ? '已注册' : '游客'}
            </span>
          </div>
          {mode === 'guest' ? (
            <Button variant="primary" size="sm" className="w-full mt-4" onClick={() => navigate('/login')}>
              注册/登录
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="w-full mt-4 text-red-500 hover:bg-red-50" onClick={handleLogout}>
              退出登录
            </Button>
          )}
        </div>

        {/* Reading level */}
        <div className="bg-white/60 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">显示</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">阅读模式</span>
            <div className="flex gap-1 bg-garden-cream rounded-lg p-0.5">
              {(['child', 'parent'] as const).map((lvl) => (
                <button
                  key={lvl}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    readingLevel === lvl
                      ? 'bg-white text-garden-forest shadow-sm'
                      : 'text-gray-400'
                  }`}
                  onClick={() => setReadingLevel(lvl)}
                >
                  {lvl === 'child' ? '👶 宝宝' : '👨‍👩‍👧 家长'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">音效</span>
            <button
              className={`w-12 h-7 rounded-full transition-colors ${
                soundEnabled ? 'bg-garden-forest' : 'bg-gray-300'
              }`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Daily limit */}
        <div className="bg-white/60 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">使用限制</h2>
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
            className="w-full accent-garden-forest"
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>10分钟</span>
            <span>60分钟</span>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white/60 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">数据</h2>
          <Button variant="ghost" size="sm" className="w-full text-red-400 hover:bg-red-50" onClick={() => setResetOpen(true)}>
            重置所有数据
          </Button>
        </div>
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
