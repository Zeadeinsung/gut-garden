import { useState, useRef, useCallback, type ReactNode } from 'react'

export interface BlockPos {
  x: number
  y: number
  w: number
  h: number
}

interface Props {
  blockId: string
  defaultPos: BlockPos
  editing: boolean
  movable?: boolean
  resizable?: boolean
  parallaxSpeed?: number
  zIndex?: number
  containerRef: React.RefObject<HTMLDivElement | null>
  onMove?: (id: string, x: number, y: number) => void
  onResize?: (id: string, w: number, h: number) => void
  children: ReactNode
  className?: string
}

const MIN_W = 48
const MIN_H = 48

type Edge = 'n' | 's' | 'w' | 'e' | 'se'

export function DraggableBlock({
  blockId,
  defaultPos,
  editing,
  movable = false,
  resizable = false,
  parallaxSpeed,
  zIndex = 10,
  containerRef,
  onMove,
  onResize,
  children,
  className,
}: Props) {
  const [pos, setPos] = useState({ x: defaultPos.x, y: defaultPos.y })
  const [size, setSize] = useState({ w: defaultPos.w, h: defaultPos.h })
  const dragging = useRef(false)
  const resizing_ = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const posRef = useRef(pos)
  const sizeRef = useRef(size)
  posRef.current = pos
  sizeRef.current = size

  const canDrag = editing || movable
  const canResize = editing || resizable
  const showChrome = editing

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!canDrag || !containerRef.current) return
      e.stopPropagation()
      e.preventDefault()
      dragging.current = true

      const rect = containerRef.current.getBoundingClientRect()
      offset.current = {
        x: e.clientX - rect.left - posRef.current.x,
        y: e.clientY - rect.top - posRef.current.y,
      }

      const onMove_ = (ev: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return
        const r = containerRef.current.getBoundingClientRect()
        const newX = Math.round(ev.clientX - r.left - offset.current.x)
        const newY = Math.round(ev.clientY - r.top - offset.current.y)
        setPos({ x: newX, y: newY })
        onMove?.(blockId, newX, newY)
      }

      const onUp = () => {
        dragging.current = false
        document.removeEventListener('mousemove', onMove_)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove_)
      document.addEventListener('mouseup', onUp)
    },
    [canDrag, containerRef, blockId, onMove],
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, edge: Edge) => {
      if (!canResize) return
      e.stopPropagation()
      e.preventDefault()
      resizing_.current = true

      const startSz = { ...sizeRef.current }
      const startP = { ...posRef.current }
      const startX = e.clientX
      const startY = e.clientY

      const onMove_ = (ev: MouseEvent) => {
        if (!resizing_.current) return
        const dx = Math.round(ev.clientX - startX)
        const dy = Math.round(ev.clientY - startY)

        let nx = startP.x
        let ny = startP.y
        let nw = startSz.w
        let nh = startSz.h

        if (edge.includes('e')) {
          nw = Math.max(MIN_W, startSz.w + dx)
        }
        if (edge.includes('w')) {
          nw = Math.max(MIN_W, startSz.w - dx)
          nx = startP.x + startSz.w - nw
        }
        if (edge.includes('s')) {
          nh = Math.max(MIN_H, startSz.h + dy)
        }
        if (edge.includes('n')) {
          nh = Math.max(MIN_H, startSz.h - dy)
          ny = startP.y + startSz.h - nh
        }

        setPos({ x: nx, y: ny })
        setSize({ w: nw, h: nh })
        onMove?.(blockId, nx, ny)
        onResize?.(blockId, nw, nh)
      }

      const onUp = () => {
        resizing_.current = false
        document.removeEventListener('mousemove', onMove_)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove_)
      document.addEventListener('mouseup', onUp)
    },
    [canResize, blockId, containerRef, onMove, onResize],
  )

  const isActive = dragging.current || resizing_.current
  const interactive = canDrag || canResize

  const edgeStyle = (edge: Edge): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', zIndex: 20 }
    switch (edge) {
      case 'n': return { ...base, top: 0, left: 4, right: 4, height: 4, cursor: 'ns-resize' }
      case 's': return { ...base, bottom: 0, left: 4, right: 4, height: 4, cursor: 'ns-resize' }
      case 'w': return { ...base, left: 0, top: 4, bottom: 4, width: 4, cursor: 'ew-resize' }
      case 'e': return { ...base, right: 0, top: 4, bottom: 4, width: 4, cursor: 'ew-resize' }
      case 'se': return showChrome
        ? { position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, zIndex: 20, cursor: 'se-resize' }
        : { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, zIndex: 20, cursor: 'se-resize' }
    }
  }

  const EDGES: Edge[] = ['n', 's', 'w', 'e', 'se']

  return (
    <div
      className={`${className || ''} ${interactive && !showChrome ? 'group' : ''}`}
      {...(parallaxSpeed !== undefined ? { 'data-parallax': parallaxSpeed } : {})}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: isActive ? Math.max(50, zIndex) : zIndex,
      }}
    >
      {/* Hover shadow for movable/resizable blocks in normal mode */}
      {interactive && !showChrome && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-garden-forest/10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-0" />
      )}

      {/* Edit-mode chrome */}
      {showChrome && (
        <>
          <div
            className="absolute -top-5 left-0 right-0 h-5 bg-garden-mascot/80 rounded-t-lg flex items-center justify-center cursor-grab active:cursor-grabbing text-white text-[10px] font-bold select-none z-10 shadow-sm"
            onMouseDown={handleDragStart}
          >
            ⋮⋮ {blockId}
          </div>

          {/* Numeric input panel */}
          <div
            className="absolute -top-14 left-0 flex items-center gap-0.5 bg-white/95 border border-garden-forest/30 rounded-md px-1.5 py-0.5 shadow-md z-30"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {([
              ['x', pos.x, (v: number) => { setPos(p => ({ ...p, x: v })); onMove?.(blockId, v, posRef.current.y) }],
              ['y', pos.y, (v: number) => { setPos(p => ({ ...p, y: v })); onMove?.(blockId, posRef.current.x, v) }],
              ['w', size.w, (v: number) => { const cv = Math.max(MIN_W, v); setSize(s => ({ ...s, w: cv })); onResize?.(blockId, cv, sizeRef.current.h) }],
              ['h', size.h, (v: number) => { const cv = Math.max(MIN_H, v); setSize(s => ({ ...s, h: cv })); onResize?.(blockId, sizeRef.current.w, cv) }],
            ] as const).map(([label, value, setter]) => (
              <label key={label} className="flex items-center gap-0.5 text-[9px] text-gray-500">
                <span className="font-mono">{label}</span>
                <input
                  type="number"
                  value={value}
                  className="w-10 h-4 border border-gray-300 rounded px-0.5 text-[9px] font-mono text-garden-forest focus:outline-none focus:border-garden-forest"
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v)) setter(v)
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </label>
            ))}
          </div>

          {/* Edge resize handles —slightly visible in edit mode */}
          {EDGES.map((edge) => (
            <div
              key={edge}
              style={edgeStyle(edge)}
              className={
                edge === 'se'
                  ? 'bg-garden-coral rounded-full shadow-sm hover:scale-125 transition-transform'
                  : 'bg-garden-mascot/20 hover:bg-garden-mascot/40 rounded transition-colors'
              }
              onMouseDown={(e) => handleResizeStart(e, edge)}
              title={edge === 'se' ? `${size.w}×${size.h}` : undefined}
            />
          ))}

          <div className="absolute inset-0 border-2 border-dashed border-garden-forest/60 rounded-lg pointer-events-none" />
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-garden-forest/50 font-mono bg-white/70 px-1 rounded whitespace-nowrap">
            {size.w}×{size.h}
          </div>
        </>
      )}

      {/* Normal-mode invisible drag handle */}
      {!showChrome && canDrag && (
        <div
          className="absolute top-0 left-4 right-4 h-3 z-10 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
        />
      )}

      {/* Normal-mode invisible edge resize handles */}
      {!showChrome && canResize &&
        EDGES.map((edge) => (
          <div
            key={edge}
            style={edgeStyle(edge)}
            onMouseDown={(e) => handleResizeStart(e, edge)}
          />
        ))
      }

      <div className={`w-full h-full ${showChrome ? 'pointer-events-none' : ''}`}>
        {children}
      </div>
    </div>
  )
}
