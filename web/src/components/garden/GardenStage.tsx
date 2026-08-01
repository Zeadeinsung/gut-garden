import { useRef } from 'react'
import { useParallax } from '@/hooks/useParallax'
import { useGardenScene } from '@/hooks/useGardenScene'

const LAYERS = [
  { name: 'garden_sky', translateZ: -200, speed: 0.1 },
  { name: 'garden_mid', translateZ: 0, speed: 0.4 },
  { name: 'garden_front', translateZ: 150, speed: 1.0 },
]

export default function GardenStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { midSrc } = useGardenScene()

  useParallax(containerRef)

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden"
      style={{ perspective: 1200, perspectiveOrigin: '50% 50%' }}>
      {LAYERS.map((l) => {
        const src = l.name === 'garden_mid' ? midSrc : `/assets/scenes/scene_${l.name}.png`
        return (
          <img
            key={l.name}
            src={src}
            data-parallax={l.speed}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
            style={{ transform: `translateZ(${l.translateZ}px) scale(${1 + l.translateZ / 800})` }}
          />
        )
      })}
    </div>
  )
}
