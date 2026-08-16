import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { UiIcon } from '@/lib/uiIcons'

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

  // Quick-browse: enter as guest with a default name if none was typed
  const handleGuestBrowse = () => {
    guestLogin(childName.trim() || '小园丁')
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
    { key: 'guest', label: '游客体验', icon: 'gamepad' },
    { key: 'register', label: '注册登录', icon: 'phone' },
  ]

  return (
    <div className="h-screen flex items-center justify-center bg-garden-mascot p-4">
      <div className="relative overflow-hidden rounded-[2rem] shadow-2xl bg-garden-cream w-[min(calc(100vw-2rem),calc((100vh-2rem)*16/10))] h-[min(calc(100vh-2rem),calc((100vw-2rem)*10/16))] flex items-center justify-center px-4">
      {/* Scene background */}
      <img
        src="/assets/scenes/scene_login_bg.png"
        alt=""
        draggable={false}
        className="absolute inset-0 z-0 w-full h-full object-cover"
      />

      <div className="relative z-10 glass-card p-8 w-full max-w-sm">
        {/* Brand logo */}
        <div className="text-center mb-4">
          <img
            src="/assets/characters/lottie/char_xianxian_idle.png"
            alt="仙仙"
            className="w-20 h-20 object-contain mx-auto"
          />
          <h1 className="text-2xl font-bold text-garden-forest mt-2">Gut Garden</h1>
          <p className="text-lg font-bold text-garden-forest">肠道花园</p>
        </div>

        {/* Slogan */}
        <p className="text-center text-gray-400 text-sm mb-6">
          每一口食物，都在浇灌你的微观生态
        </p>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-garden-cream rounded-xl p-1 mb-6">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                tab === key
                  ? 'bg-white text-garden-forest shadow-sm'
                  : 'text-gray-400 hover:text-garden-forest/70'
              }`}
              onClick={() => setTab(key)}
            >
              <UiIcon name={icon} size={15} />
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
              <span className="inline-flex items-center gap-1.5">开始探索 <UiIcon name="sprout" size={16} /></span>
            </Button>
            <button
              className="text-center text-sm text-garden-forest/60 hover:text-garden-forest transition-colors inline-flex items-center justify-center gap-1"
              onClick={handleGuestBrowse}
            >
              <UiIcon name="eye" size={15} /> 先看看 →（以游客身份浏览）
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 inline-flex items-center gap-1.5"><UiIcon name="phone" size={14} /> 手机号</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-garden-forest transition-colors"
                placeholder="输入11位手机号"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 inline-flex items-center gap-1.5"><UiIcon name="hash" size={14} /> 验证码</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-garden-forest transition-colors"
                  placeholder="输入验证码"
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
                  {countdown > 0 ? `${countdown}s` : sending ? '发送中...' : '发送验证码'}
                </button>
              </div>
            </div>
            <Button variant="primary" size="lg" className="w-full bg-garden-mascot hover:bg-[#7A9538]" onClick={handleLogin} disabled={!phone || !code}>
              <span className="inline-flex items-center gap-1.5"><UiIcon name="key" size={16} /> 登录/注册</span>
            </Button>
            <button
              className="text-center text-sm text-garden-forest/60 hover:text-garden-forest transition-colors inline-flex items-center justify-center gap-1"
              onClick={handleGuestBrowse}
            >
              <UiIcon name="eye" size={15} /> 先看看 →（以游客身份浏览）
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed inline-flex items-start gap-1 justify-center">
          <UiIcon name="clipboard" size={13} className="shrink-0 mt-0.5" /> 本项目用于健康科普，不构成医疗建议。基于国产开源大模型。
        </p>
        <p className="text-[10px] text-gray-300 text-center mt-1">
          数据仅存本地 · 不构成医疗建议 · 出现持续症状请就医
        </p>
      </div>
      </div>
    </div>
  )
}
