import { useState, useEffect, useCallback } from 'react'

const EDIT_KEY = 'gg-edit-mode'

export function useEditMode() {
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault()
        setEditing((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return editing
}

export interface BlockPos {
  x: number
  y: number
  w: number
  h: number
}

const STORAGE_KEY = 'gg-block-positions'
const LAYOUT_VERSION = 7

export interface LoadedPositions {
  blocks: Record<string, BlockPos>
  /** 已保存布局的版本：0=无存档, 1=旧版无版本标记, 5=当前版本 */
  version: number
}

export function loadPositions(page: string): LoadedPositions {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${page}`)
    if (!raw) return { blocks: {}, version: 0 }
    const parsed = JSON.parse(raw)
    // 新格式：{ v: 2, blocks: {...} }；旧格式为裸位置表（无版本标记，按 v1 处理）
    if (parsed && typeof parsed === 'object' && typeof parsed.v === 'number' && parsed.blocks && typeof parsed.blocks === 'object') {
      return { blocks: parsed.blocks, version: parsed.v }
    }
    return { blocks: parsed, version: 1 }
  } catch {
    return { blocks: {}, version: 0 }
  }
}

export function savePositions(page: string, positions: Record<string, BlockPos>) {
  localStorage.setItem(`${STORAGE_KEY}-${page}`, JSON.stringify({ v: LAYOUT_VERSION, blocks: positions }))
}
