import { useGardenStore } from '@/stores/gardenStore'

const CHARACTER_STATES: Record<string, string> = {
  healthy: '😊',
  high_sugar: '😣',
  dry: '🥵',
  recovering: '🤕',
}

export function Character() {
  const currentState = useGardenStore((s) => s.currentState)
  const emoji = CHARACTER_STATES[currentState] || '😊'

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="relative">
        {/* Character sprite placeholder — will be replaced with actual art */}
        <div className="w-24 h-24 flex items-center justify-center">
          <img
            src="/assets/characters/png/char_xiaoyuan.png"
            alt="小圆"
            className="w-full h-full object-contain animate-float"
          />
        </div>
        {/* Reaction emoji bubble */}
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
          {emoji}
        </div>
      </div>
    </div>
  )
}
