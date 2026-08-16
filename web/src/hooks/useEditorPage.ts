import { useRef, useState, useCallback, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { loadPositions, savePositions, type BlockPos } from '@/hooks/useEditMode'

interface UseEditorPageOptions {
  /** Post-process merged positions after loading saved state.
   *  layoutVersion: 已保存布局的版本（0=无存档, 1=旧版, >=3=当前版），用于一次性迁移 */
  init?: (merged: Record<string, BlockPos>, layoutVersion: number) => Record<string, BlockPos>
}

export function useEditorPage(page: string, defaults: Record<string, BlockPos>, options?: UseEditorPageOptions) {
  const editing = useUIStore((s) => s.editing)
  const containerRef = useRef<HTMLDivElement>(null)

  const [positions, setPositions] = useState(() => {
    const { blocks, version } = loadPositions(page)
    let merged = { ...defaults, ...blocks }
    if (options?.init) merged = options.init(merged, version)
    return merged
  })

  const handleMove = useCallback((id: string, x: number, y: number) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: { ...prev[id], x, y } }
      savePositions(page, next)
      return next
    })
  }, [page])

  const handleResize = useCallback((id: string, w: number, h: number) => {
    setPositions((prev) => {
      const next = { ...prev, [id]: { ...prev[id], w, h } }
      savePositions(page, next)
      return next
    })
  }, [page])

  const pos = useCallback(
    (id: string): BlockPos => positions[id] || defaults[id],
    [positions, defaults],
  )

  const handleReset = useCallback(() => {
    localStorage.removeItem(`gg-block-positions-${page}`)
    let reset = { ...defaults }
    if (options?.init) reset = options.init(reset, 0)
    setPositions(reset)
  }, [page, defaults, options])

  useEffect(() => {
    fetch('/__debug/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(positions),
    }).catch(() => {})
  }, [positions])

  return { editing, containerRef, positions, pos, handleMove, handleResize, handleReset }
}
