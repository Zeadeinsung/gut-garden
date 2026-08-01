import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export default function ProfilePage() {
  const { user, mode } = useAuthStore()
  const { readingLevel, soundEnabled, setReadingLevel, setSoundEnabled } = useUIStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAge, setNewAge] = useState(6)

  const activeChild = user?.children.find((c) => c.id === user.active_child_id)

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm px-6 py-6 rounded-b-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-garden-sky flex items-center justify-center text-3xl">
            {activeChild?.avatar_url ? (
              <img src={activeChild.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              '👶'
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-garden-forest">
              {activeChild?.name ?? '未设置'}
            </h1>
            <p className="text-sm text-gray-400">
              {activeChild ? `${activeChild.age}岁` : '添加宝宝信息'}
            </p>
          </div>
        </div>
      </div>

      {/* Children list */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">宝宝</h2>
          <button
            className="text-xs text-garden-forest font-medium hover:underline"
            onClick={() => { setNewName(''); setNewAge(6); setAddOpen(true) }}
          >
            + 添加
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {user?.children.map((child) => (
            <div
              key={child.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                child.id === user.active_child_id
                  ? 'bg-garden-forest/10 border border-garden-forest/30'
                  : 'bg-white/50 border border-transparent'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-garden-sky flex items-center justify-center text-lg">
                {child.avatar_url ? (
                  <img src={child.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👶'
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-700">{child.name}</p>
                <p className="text-xs text-gray-400">{child.age}岁</p>
              </div>
              {child.id === user.active_child_id && (
                <span className="text-xs bg-garden-forest text-white px-2 py-0.5 rounded-full">当前</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">设置</h2>
        <div className="bg-white/50 rounded-xl divide-y divide-gray-100">
          <div className="flex items-center justify-between p-4">
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
          <div className="flex items-center justify-between p-4">
            <span className="text-gray-700">音效</span>
            <button
              className={`w-12 h-7 rounded-full transition-colors ${
                soundEnabled ? 'bg-garden-forest' : 'bg-gray-300'
              }`}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="px-6 mt-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">账户</h2>
        <div className="bg-white/50 rounded-xl">
          <div className="flex items-center justify-between p-4">
            <span className="text-gray-700">账户状态</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              mode === 'registered' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {mode === 'registered' ? '已注册' : '游客模式'}
            </span>
          </div>
          <div className="p-4 pt-0">
            {mode === 'guest' ? (
              <Button variant="primary" size="sm" className="w-full" onClick={() => navigate('/login')}>
                注册/登录
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full text-red-500 hover:bg-red-50" onClick={() => { logout(); navigate('/login') }}>
                退出登录
              </Button>
            )}
          </div>
        </div>
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
              type="number"
              min={0}
              max={18}
              value={newAge}
              onChange={(e) => setNewAge(Number(e.target.value))}
            />
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              if (!newName.trim()) return
              const store = useAuthStore.getState()
              const newChild = {
                id: Date.now(),
                name: newName.trim(),
                age: newAge,
                avatar_url: null,
              }
              store.setUser({
                ...store.user!,
                children: [...(store.user?.children ?? []), newChild],
                active_child_id: store.user?.active_child_id ?? newChild.id,
                parent_id: store.user?.parent_id ?? 0,
                phone: store.user?.phone ?? '',
              })
              setAddOpen(false)
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
