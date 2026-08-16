import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { UiIcon } from '@/lib/uiIcons'
import type { BadgeDef, BadgeRarity } from '@/types/badges'

const BADGE_FRAMES: Record<BadgeRarity, string> = {
  bronze: '/assets/badges/frames/ui_badge_frame_bronze.png',
  silver: '/assets/badges/frames/ui_badge_frame_silver.png',
  gold: '/assets/badges/frames/ui_badge_frame_gold.png',
}

const PAGE_W = 300
const PAGE_H = 190
const SPINE_W = 18
// 书本布局基准尺寸（含封面外延 / 阴影空间），用于按容器等比缩放
const BOOK_W = 618
const BOOK_H = 208

// 每页 4 枚徽章，左页 + 右页 = 一次翻开看到 8 枚
const PER_PAGE = 4
const PER_SPREAD = 8
const FLIP_MS = 520
const FLIP_HALF = 250

interface BadgeBookProps {
  defs: BadgeDef[]
  awardedCodes: Set<string>
  awardedRarities?: Record<string, BadgeRarity>
}

function LockBadge({ size = 10 }: { size?: number }) {
  return (
    <div className="absolute -bottom-[2px] -right-[2px] w-[16px] h-[16px] rounded-full bg-[#455A64] border border-white/70 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
      <UiIcon name="lock" size={size} className="text-white" />
    </div>
  )
}

function BadgeCircle({ def, awarded, rarity }: { def: BadgeDef; awarded: boolean; rarity?: BadgeRarity }) {
  return (
    <div className={`relative ${awarded ? 'drop-shadow-[0_0_6px_rgba(255,205,0,0.55)]' : 'grayscale brightness-[0.75] opacity-60'}`}>
      <img src={def.icon_url} alt={def.name} className="w-[80px] h-[80px] object-contain" />
      {awarded && rarity && (
        <img
          src={BADGE_FRAMES[rarity]}
          alt=""
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92px] h-[92px] object-contain pointer-events-none"
        />
      )}
      {!awarded && <LockBadge />}
    </div>
  )
}

interface FaceProps {
  side: 'left' | 'right'
  defs: BadgeDef[]
  awardedCodes: Set<string>
  awardedRarities?: Record<string, BadgeRarity>
  style?: CSSProperties
}

function Face({ side, defs, awardedCodes, awardedRarities, style }: FaceProps) {
  const round = side === 'left' ? 'rounded-l-[7px]' : 'rounded-r-[7px]'
  const bg = side === 'left'
    ? 'radial-gradient(ellipse at 35% 18%, #FFFDF7 25%, #F3E7C4 100%)'
    : 'radial-gradient(ellipse at 65% 18%, #FFFDF7 25%, #F3E7C4 100%)'
  return (
    <div
      className={`absolute inset-0 ${round} overflow-hidden`}
      style={{ backfaceVisibility: 'hidden', background: bg, ...style }}
    >
      {side === 'left' ? (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-[16px] bg-gradient-to-r from-[#3D2B1F]/12 to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-gradient-to-l from-[#B08A45]/25 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-[16px] bg-gradient-to-l from-[#3D2B1F]/12 to-transparent" />
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-[#B08A45]/25 to-transparent" />
        </>
      )}
      <div className="relative z-10 h-full grid grid-cols-2 grid-rows-2 gap-2 place-content-center place-items-center px-4 py-1">
        {defs.map((def) => <BadgeCircle key={def.code} def={def} awarded={awardedCodes.has(def.code)} rarity={awardedRarities?.[def.code]} />)}
      </div>
    </div>
  )
}

export default function BadgeBook({ defs, awardedCodes, awardedRarities }: BadgeBookProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const [scale, setScale] = useState(1)

  const maxPage = Math.max(0, Math.ceil(defs.length / PER_SPREAD) - 1)
  const [page, setPage] = useState(0)
  const [leftDefs, setLeftDefs] = useState<BadgeDef[]>(() => defs.slice(0, PER_PAGE))
  const [frontDefs, setFrontDefs] = useState<BadgeDef[]>(() => defs.slice(PER_PAGE, PER_SPREAD))
  const [backDefs, setBackDefs] = useState<BadgeDef[]>([])

  const leftSliceAt = (p: number) => defs.slice(p * PER_SPREAD, p * PER_SPREAD + PER_PAGE)
  const rightSliceAt = (p: number) => defs.slice(p * PER_SPREAD + PER_PAGE, p * PER_SPREAD + PER_SPREAD)

  // 跟随容器尺寸等比缩放，使编辑模式下拖拽块大小可改变书本大小
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w > 0 && h > 0) {
        const s = Math.min(w / BOOK_W, h / BOOK_H)
        setScale(Math.max(0.4, Math.min(1.6, s)))
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // defs 变化（新徽章解锁）时，把当前页收敛到合法范围并同步两页内容
  useEffect(() => {
    const m = Math.max(0, Math.ceil(defs.length / PER_SPREAD) - 1)
    setPage((p) => Math.min(p, m))
  }, [defs])

  useEffect(() => {
    setLeftDefs(leftSliceAt(page))
    setFrontDefs(rightSliceAt(page))
  }, [defs, page])

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), [])

  const flipTo = (target: number) => {
    if (busyRef.current || !flipRef.current) return
    busyRef.current = true
    const dir = target > page ? -1 : 1
    const el = flipRef.current
    setBackDefs(rightSliceAt(target))
    el.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.4,0.2,0.2,1)`
    el.style.transform = `translateZ(6px) rotateY(${dir * 180}deg)`
    timersRef.current.push(window.setTimeout(() => {
      setLeftDefs(leftSliceAt(target))
      setFrontDefs(rightSliceAt(target))
    }, FLIP_HALF))
    timersRef.current.push(window.setTimeout(() => {
      el.style.transition = 'none'
      el.style.transform = 'rotateY(0deg)'
      setPage(target)
      busyRef.current = false
    }, FLIP_MS))
  }

  const goNext = () => {
    if (page >= maxPage) return
    flipTo(page + 1)
  }
  const goPrev = () => {
    if (page <= 0) return
    flipTo(page - 1)
  }

  const handleShare = () => {
    const text = `我在肠道花园收集了 ${awardedCodes.size}/${defs.length} 枚徽章！`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <div ref={rootRef} className="w-full h-full relative overflow-visible">
      {/* 书本整体按容器等比缩放，保持居中 */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: BOOK_W,
          height: BOOK_H,
          transform: `translate(-50%,-50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ perspective: '1000px', perspectiveOrigin: '50% 24%' }}
        >
          {/* 整本书后仰倾斜 */}
          <div style={{ transformStyle: 'preserve-3d', transform: 'rotateX(26deg)' }}>
            <div className="relative flex items-start" style={{ transformStyle: 'preserve-3d' }}>
              {/* ── 左页：4 枚徽章 ── */}
              <div
                className="relative"
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(11deg)',
                  transformOrigin: 'right center',
                }}
              >
                <div className="absolute -top-[4px] -left-[5px] -right-[2px] -bottom-[4px] rounded-[9px] bg-[#EADFBC] shadow-[inset_2px_2px_2px_rgba(0,0,0,0.05)]" />
                <div className="absolute -top-[7px] -left-[8px] -right-[4px] -bottom-[7px] rounded-[10px] bg-[#DCCFA6]" />
                <div className="absolute -top-[9px] -left-[10px] -right-[2px] -bottom-[5px] rounded-[11px] bg-gradient-to-b from-[#5DA94F] via-[#3F8A38] to-[#2C7230] shadow-[inset_0_2px_3px_rgba(255,255,255,0.22),inset_0_-2px_3px_rgba(0,0,0,0.25)]" />
                <div className="absolute -top-[9px] -left-[10px] -right-[2px] -bottom-[5px] rounded-[11px] border-2 border-[#E9C767]/70" />
                <Face side="left" defs={leftDefs} awardedCodes={awardedCodes} awardedRarities={awardedRarities} />
              </div>

              {/* ── 书脊 ── */}
              <div className="relative" style={{ width: SPINE_W, height: PAGE_H, transform: 'translateZ(2px)' }}>
                <div
                  className="absolute -inset-y-[6px] -left-[3px] -right-[3px]"
                  style={{
                    background: 'linear-gradient(90deg,#5C4128,#8B6B4A 40%,#5C4128 70%,#4A331F)',
                    borderRadius: 5,
                    boxShadow:
                      'inset 0 2px 3px rgba(255,255,255,0.15), inset 0 -3px 4px rgba(0,0,0,0.35), inset 2px 0 3px rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="absolute left-1/2 -translate-x-1/2 top-[6px] bottom-[6px] flex flex-col justify-between">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span key={i} className="w-[3px] h-[3px] rounded-full bg-[#3B2A18]/60" />
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 右页：4 枚徽章（可翻页） ── */}
              <div
                className="relative"
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(-11deg)',
                  transformOrigin: 'left center',
                }}
              >
                <div className="absolute -top-[4px] -left-[2px] -right-[5px] -bottom-[4px] rounded-[9px] bg-[#EADFBC] shadow-[inset_-2px_2px_2px_rgba(0,0,0,0.05)]" />
                <div className="absolute -top-[7px] -left-[4px] -right-[8px] -bottom-[7px] rounded-[10px] bg-[#DCCFA6]" />
                <div className="absolute -top-[9px] -left-[2px] -right-[10px] -bottom-[5px] rounded-[11px] bg-gradient-to-b from-[#5DA94F] via-[#3F8A38] to-[#2C7230] shadow-[inset_0_2px_3px_rgba(255,255,255,0.22),inset_0_-2px_3px_rgba(0,0,0,0.25)]" />
                <div className="absolute -top-[9px] -left-[2px] -right-[10px] -bottom-[5px] rounded-[11px] border-2 border-[#E9C767]/70" />
                {/* 翻页容器：围绕书脊（左缘）旋转 */}
                <div
                  ref={flipRef}
                  className="absolute inset-0"
                  style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center', transform: 'rotateY(0deg)' }}
                >
                  <Face side="right" defs={frontDefs} awardedCodes={awardedCodes} awardedRarities={awardedRarities} />
                  <Face side="right" defs={backDefs} awardedCodes={awardedCodes} awardedRarities={awardedRarities} style={{ transform: 'rotateY(180deg)' }} />
                </div>
                {/* 翻页控件（图标，不随纸面翻转） */}
                <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 select-none">
                  <button
                    type="button"
                    onClick={goPrev}
                    className={`w-[20px] h-[20px] rounded-full flex items-center justify-center bg-[#8B6B4A]/15 text-[#7A5C3A] hover:bg-[#8B6B4A]/30 active:scale-90 transition-all ${page > 0 ? '' : 'opacity-30 pointer-events-none'}`}
                  >
                    <UiIcon name="chevronLeft" size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className={`w-[20px] h-[20px] rounded-full flex items-center justify-center bg-[#8B6B4A]/15 text-[#7A5C3A] hover:bg-[#8B6B4A]/30 active:scale-90 transition-all ${page < maxPage ? '' : 'opacity-30 pointer-events-none'}`}
                  >
                    <UiIcon name="chevronRight" size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 底部投影 */}
          <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-[600px] h-[22px] rounded-[50%] bg-[#4A3A2A]/35 blur-[6px]" />

          {/* 右侧方形分享按钮 */}
          <button
            type="button"
            onClick={handleShare}
            className="absolute -right-[136px] top-1/2 -translate-y-1/2 rotate-[-12deg] z-10 flex flex-col items-center justify-center w-[112px] h-[86px] rounded-[16px] bg-gradient-to-b from-[#8B5CF6] to-[#6D28D9] text-white shadow-[0_3px_8px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-95 transition-all"
          >
            <UiIcon name="share" size={20} />
            <span className="text-[15px] font-bold leading-[1.2] text-center mt-1">
              分享我的<br />徽章墙
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
