interface Props {
  energy: number
}

export default function EnergyCard({ energy }: Props) {
  const pct = Math.round(Math.min(100, Math.max(0, energy)))
  return (
    <div className="flex flex-col items-center justify-center px-6 h-full relative overflow-hidden">
      <img src="/assets/tasks/task_bg2.png" alt="" className="absolute inset-0 w-full h-full object-fill" draggable={false} />
      <h3 className="relative z-10 text-[15px] font-bold text-gray-600 tracking-wide">今日花园能量</h3>
      <div className="relative z-10 flex items-baseline leading-none mt-1">
        <span className="ggc-energy-num">{pct}</span>
        <span className="ggc-energy-total text-[18px] font-bold ml-1">/ 100</span>
      </div>
      <div className="relative z-10 ggc-energy-progress w-full mt-3">
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="relative z-10 text-[14px] font-semibold text-green-800 mt-2.5">距离花园开花还差 {100 - pct} 能量 🌸</p>
    </div>
  )
}
