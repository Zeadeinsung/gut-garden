import { useEffect, useRef } from 'react'
import { UiIcon } from '@/lib/uiIcons'

interface LottiePlayerProps {
  src?: string
  autoplay?: boolean
  loop?: boolean
  className?: string
}

export function LottiePlayer({ src, autoplay = true, loop = true, className = '' }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!src || !containerRef.current) return
    // Placeholder for dotLottie-web or lottie-web integration
    // Will load and play Lottie JSON from src when animated assets are ready
  }, [src])

  if (!src) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center ${className}`}>
        <span className="animate-pulse text-gray-400"><UiIcon name="clapperboard" size={36} strokeWidth={1.4} /></span>
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}
