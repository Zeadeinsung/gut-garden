export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block animate-spin rounded-full border-3 border-garden-cream border-t-garden-forest w-8 h-8 ${className}`} />
  )
}
