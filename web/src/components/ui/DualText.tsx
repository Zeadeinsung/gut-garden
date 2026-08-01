import { useReadingLevelCtx } from '@/providers/ReadingLevelProvider'

interface DualTextProps {
  child: string
  parent: string
  className?: string
}

export function DualText({ child, parent, className }: DualTextProps) {
  const { level } = useReadingLevelCtx()
  const text = level === 'child' ? child : parent
  return <span className={className}>{text}</span>
}
