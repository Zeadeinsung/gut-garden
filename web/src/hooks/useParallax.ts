import { useEffect, type RefObject } from 'react'

export function useParallax(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return

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

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [containerRef])
}
