import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

type Tab = 'guest' | 'register'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('guest')
  const [childName, setChildName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { guestLogin, sendCode, verifyCode } = useAuth()
  const navigate = useNavigate()

  const handleGuest = () => {
    if (!childName.trim()) return
    guestLogin(childName.trim())
    navigate('/')
  }

  const handleSendCode = async () => {
    if (!phone || countdown > 0) return
    setSending(true)
    try {
      await sendCode(phone)
      let n = 60
      setCountdown(n)
      const timer = setInterval(() => {
        n--
        if (n <= 0) { clearInterval(timer); setCountdown(0) }
        else setCountdown(n)
      }, 1000)
    } catch { /* toast handled globally */ }
    finally { setSending(false) }
  }

  const handleLogin = async () => {
    if (!phone || !code) return
    try {
      await verifyCode(phone, code)
      navigate('/')
    } catch { /* toast handled globally */ }
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'guest', label: '游客体验', icon: '🎮' },
    { key: 'register', label: '注册登录', icon: '📱' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-garden-cream px-4">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-garden-forest mb-2">肠道花园</h1>
        <p className="text-center text-gray-400 text-sm mb-6">宝宝肠道健康好帮手</p>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-garden-cream rounded-xl p-1 mb-6">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-white text-garden-forest shadow-sm'
                  : 'text-gray-400 hover:text-garden-forest/70'
              }`}
              onClick={() => setTab(key)}
            >
              <span className="mr-1">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {tab === 'guest' ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">宝宝的名字</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-garden-forest transition-colors"
                placeholder="输入宝宝的名字或昵称"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGuest()}
              />
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={handleGuest} disabled={!childName.trim()}>
              开始探索 🌱
            </Button>
            <p className="text-xs text-gray-400 text-center">
              游客模式下部分功能可用，注册后可同步数据
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">手机号</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-garden-forest transition-colors"
                placeholder="输入手机号"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-garden-forest transition-colors"
                placeholder="验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                className={`px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  countdown > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-garden-cream text-garden-forest hover:bg-garden-sky/50'
                }`}
                onClick={handleSendCode}
                disabled={!phone || countdown > 0 || sending}
              >
                {countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '获取验证码'}
              </button>
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={handleLogin} disabled={!phone || !code}>
              登录
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
