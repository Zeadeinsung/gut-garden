interface POITagProps {
  name: string
  x: number
  y: number
  unlocked: boolean
  onClick?: () => void
}

export function POITag({ name, x, y, unlocked, onClick }: POITagProps) {
  return (
    <button
      className={`absolute z-20 transition-all duration-300 ${
        unlocked
          ? 'opacity-100 hover:scale-110'
          : 'opacity-40 grayscale cursor-not-allowed'
      }`}
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
    >
      <div className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md ${
        unlocked
          ? 'bg-white/90 text-garden-forest'
          : 'bg-gray-200 text-gray-400'
      }`}>
        {unlocked ? name : '🔒'}
      </div>
    </button>
  )
}
