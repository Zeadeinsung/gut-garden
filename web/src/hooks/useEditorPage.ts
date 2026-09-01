import { useRef, useState, useCallback, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { loadPositions, savePositions, LAYOUT_VERSION, type BlockPos } from '@/hooks/useEditMode'
import { LAYOUT_SEEDS } from '@/lib/layoutSeeds'

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
    // 种子布局（烘焙的本地调试布局）作为基准；只有「当前版本」的存档才允许覆盖种子，
    // 旧版本残留（修复前保存的坏布局，如 v7）一律丢弃，避免覆盖烘焙好的种子布局。
    let merged = { ...defaults, ...(LAYOUT_SEEDS[page] || {}) }
    const stale = version > 0 && version < LAYOUT_VERSION
    if (!stale) merged = { ...merged, ...blocks }
    if (options?.init) merged = options.init(merged, version === 0 ? LAYOUT_VERSION : version)
    // 旧版残留存档被丢弃后，立即用当前版重写存档，清除历史坏数据
    if (stale) savePositions(page, merged)
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
    let reset = { ...defaults, ...(LAYOUT_SEEDS[page] || {}) }
    if (options?.init) reset = options.init(reset, LAYOUT_VERSION)
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
