import { useEffect, useRef } from 'react'

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
        <span className="text-4xl animate-pulse">🎬</span>
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}
