import { useAuth } from '../providers/AuthProvider'

export default function SettingsPage() {
  const { logout } = useAuth()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-garden-brown)' }}>设置</h1>
      <div className="bg-white/60 backdrop-blur rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm text-gray-500">每日使用时长（分钟）</label>
          <input type="range" min={10} max={60} defaultValue={30} className="w-full" />
          <span className="text-sm">30 分钟</span>
        </div>
        <button
          className="px-6 py-2 bg-red-200 rounded-lg text-sm"
          onClick={logout}
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
