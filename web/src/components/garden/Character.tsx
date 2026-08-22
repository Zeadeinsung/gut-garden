import { useGardenStore } from '@/stores/gardenStore'

const STATE_SPRITES: Record<string, string> = {
  healthy: '/assets/characters/lottie/char_xiaoyuan_idle.webp',
  high_sugar: '/assets/characters/lottie/char_xiaoyuan_worry.webp',
  dry: '/assets/characters/lottie/char_xiaoyuan_worry.webp',
  recovering: '/assets/characters/png/char_xiaoyuan.webp',
}

export function Character() {
  const currentState = useGardenStore((s) => s.currentState)
  const sprite = STATE_SPRITES[currentState] || STATE_SPRITES.healthy

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="relative">
        <div className="w-24 h-24 flex items-center justify-center">
          <img
            src={sprite}
            alt="小圆"
            className="w-full h-full object-contain animate-float"
          />
        </div>
      </div>
    </div>
  )
}
