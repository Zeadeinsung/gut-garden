interface Props {
  level: number
  stageName: string
}

export default function LevelCard({ level, stageName }: Props) {
  return (
    <div className="ggc-level-card ggc-clay flex items-center gap-3 px-5 h-full overflow-hidden">
      <span className="text-[42px] leading-none drop-shadow-sm shrink-0">🌱</span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-gray-500">生态等级</p>
        <p className="text-[30px] font-extrabold leading-tight text-green-700">Lv.{level}</p>
        <p className="text-[13px] text-green-600 mt-0.5 whitespace-nowrap">{stageName}</p>
      </div>
    </div>
  )
}
