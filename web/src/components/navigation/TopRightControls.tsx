import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useGardenStore } from '@/stores/gardenStore'
import { useUIStore } from '@/stores/uiStore'
import { UiIcon } from '@/lib/uiIcons'

export default function TopRightControls() {
  const navigate = useNavigate()
  const { soundEnabled, setSoundEnabled } = useUIStore()
  const { user } = useAuthStore()
  const { gardenLevel } = useGardenStore()

  const child = user?.children.find((c) => c.id === user.active_child_id)
  const childAvatar = child?.avatar_url

  return (
    <div className="flex items-center gap-2">
      <button
        className="flex items-center gap-1.5 shrink-0 hover:opacity-90 transition-opacity"
        onClick={() => navigate('/profile')}
        title="我的主页"
      >
        <span className="w-9 h-9 rounded-full bg-garden-sky flex items-center justify-center overflow-hidden ring-2 ring-white/90 shadow-md shrink-0">
          <img
            src={childAvatar || '/assets/ui/ui_avatar_default_child.webp'}
            alt=""
            className="w-full h-full rounded-full object-cover"
            draggable={false}
          />
        </span>
        <span className="text-[10px] font-semibold text-white bg-[#4CAF50] px-2 py-1 rounded-full whitespace-nowrap inline-flex items-center gap-1 shadow-sm">
          <UiIcon name="sprout" size={11} />
          Lv.{gardenLevel}
        </span>
      </button>
      <button
        className="w-11 h-11 rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md hover:bg-[#7A9538] hover:scale-105 active:scale-95 transition-all"
        onClick={() => navigate('/settings')}
        title="设置"
      >
        <UiIcon name="settingsLine" size={20} />
      </button>
      <button
        className="w-11 h-11 rounded-full bg-garden-mascot text-white flex items-center justify-center shadow-md hover:bg-[#7A9538] hover:scale-105 active:scale-95 transition-all"
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? '关闭音效' : '开启音效'}
      >
        <UiIcon name={soundEnabled ? 'volumeLine' : 'volumeMuteLine'} size={20} />
      </button>
    </div>
  )
}
