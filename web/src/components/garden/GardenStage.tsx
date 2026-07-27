import { useEffect, useRef } from 'react'
import { useGardenStore } from '../../stores/gardenStore'

const LAYERS = [
  { name: 'sky',  translateZ: -300, speed: 0 },
  { name: 'far',  translateZ: -150, speed: 0.2 },
  { name: 'mid',  translateZ: 0,    speed: 0.5 },
  { name: 'near', translateZ: 150,  speed: 1.0 },
]

export default function GardenStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentState = useGardenStore((s) => s.currentState)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      el.querySelectorAll<HTMLElement>('[data-parallax]').forEach((layer) => {
        const speed = parseFloat(layer.dataset.parallax || '0')
        layer.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const midLayer = currentState === 'healthy' ? '/assets/scene/scene_mid.png'
    : currentState === 'high_sugar' ? '/assets/scene/scene_mid_high_sugar.png'
    : '/assets/scene/scene_mid_dry.png'

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden"
      style={{ perspective: 1200, perspectiveOrigin: '50% 50%' }}>
      {LAYERS.map((l) => {
        const src = l.name === 'mid' ? midLayer : `/assets/scene/scene_${l.name}.png`
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
