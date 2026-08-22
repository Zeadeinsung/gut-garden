import { useNavigate } from 'react-router-dom'
import { UiIcon } from '@/lib/uiIcons'
import TopRightControls from '@/components/navigation/TopRightControls'

export default function TopHeader() {
  const navigate = useNavigate()
  return (
    <header className="shrink-0 flex items-center justify-between px-6 py-2">
      <div className="flex items-center gap-2">
        <button
          className="w-9 h-9 rounded-full bg-garden-mascot text-white shadow-md hover:bg-[#7A9538] active:scale-95 transition-all flex items-center justify-center"
          onClick={() => navigate('/')}
          title="返回首页"
        >
          <UiIcon name="chevronLeft" size={20} />
        </button>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-lg text-garden-forest">每日打卡</p>
            <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center leading-none">?</span>
          </div>
          <p className="text-[10px] text-gray-500">每天照顾一点点，花园会更好哦！</p>
        </div>
      </div>
      <TopRightControls />
    </header>
  )
}
