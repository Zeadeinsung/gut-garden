import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex h-screen">
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
      <aside className="w-80 bg-white/30 backdrop-blur p-4 border-l border-white/20">
        {/* Sidebar: 今日打卡缩略 + 最新徽章 */}
        <div className="text-sm text-gray-500">今日进度</div>
      </aside>
    </div>
  )
}
