interface Props {
  streak: number
}

const WEEKDAY = ['一', '二', '三', '四', '五', '六', '日']

export default function StreakCalendar({ streak }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // 周一=0

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const rows = cells.length / 7

  return (
    <div className="ggc-card bg-[rgba(255,249,226,0.9)] backdrop-blur-md flex flex-col h-full p-3 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-[15px] font-bold text-gray-700 inline-flex items-center gap-1">📅 {year}年{month + 1}月</h3>
        <p className="text-[13px] font-bold text-orange-600">连续 {streak} 天 🔥</p>
      </div>

      <div className="grid grid-cols-7 text-center shrink-0 mt-1.5">
        {WEEKDAY.map((w) => (
          <span key={w} className="text-[11px] font-medium text-gray-400">{w}</span>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 gap-0.5 mt-1 text-center" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const date = new Date(year, month, d)
          const diff = Math.round((today.getTime() - date.getTime()) / 86400000)
          const isToday = diff === 0
          const isChecked = diff >= 0 && diff < streak
          const isFuture = diff < 0
          let cls = 'text-gray-500'
          if (isToday) {
            cls = 'bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow'
          } else if (isChecked) {
            cls = 'bg-[#d9efbe] text-green-700'
          } else if (isFuture) {
            cls = 'text-gray-300'
          }
          return (
            <div key={i} className={`flex items-center justify-center rounded-[8px] ${cls}`}>
              <span className="text-[13px] font-bold leading-none">{d}</span>
            </div>
          )
        })}
      </div>

      <p className="mt-auto pt-1.5 text-[10px] text-amber-600 inline-flex items-center gap-1">🎁 连续 7 天可获得神秘种子哦！</p>
    </div>
  )
}
