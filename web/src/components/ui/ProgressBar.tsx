interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: string
}

export function ProgressBar({ value, max = 100, className = '', color = 'bg-garden-forest' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`h-3 rounded-full bg-garden-cream overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
