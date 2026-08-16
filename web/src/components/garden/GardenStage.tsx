import { useRef } from 'react'
import { useParallax } from '@/hooks/useParallax'
import { useGardenScene } from '@/hooks/useGardenScene'

export default function GardenStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { skySrc, midSrc, frontSrc } = useGardenScene()

  const LAYERS = [
    { name: 'garden_sky', src: skySrc, translateZ: -200, speed: 0.1 },
    { name: 'garden_mid', src: midSrc, translateZ: 0, speed: 0.4 },
    { name: 'garden_front', src: frontSrc, translateZ: 150, speed: 1.0 },
  ]

  useParallax(containerRef)

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden"
      style={{ perspective: 1200, perspectiveOrigin: '50% 50%' }}>
      {LAYERS.map((l) => (
        <img
          key={l.name}
          src={l.src}
          data-parallax={l.speed}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
          style={{ transform: `translateZ(${l.translateZ}px) scale(${1 + l.translateZ / 800})` }}
        />
      ))}
    </div>
  )
}
