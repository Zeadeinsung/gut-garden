import { useState } from 'react'

export interface HistoryPoint {
  label: string
  value: number
}

interface Props {
  data: HistoryPoint[]
  unit?: string
}

const W = 720
const H = 250
const PAD = { top: 18, right: 14, bottom: 30, left: 42 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom
const minX = PAD.left
const maxX = W - PAD.right
const minY = PAD.top
const maxY = H - PAD.bottom

/* Catmull-Rom → 三次贝塞尔，让折线变圆润 */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

export default function HistoryChart({ data, unit = '天' }: Props) {
  const [sel, setSel] = useState(Math.max(0, data.length - 1))
  if (data.length < 2) return null

  const axisStep = Math.max(1, Math.ceil(Math.max(...data.map((d) => d.value)) / 5))
  const axisMax = axisStep * 5
  const toX = (i: number) => minX + (i * plotW) / (data.length - 1)
  const toY = (v: number) => minY + (1 - v / axisMax) * plotH

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }))
  const path = smoothPath(pts)
  const area = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${maxY} L ${pts[0].x.toFixed(1)} ${maxY} Z`
  const ticks = Array.from({ length: 6 }, (_, i) => i * axisStep)
  const selPt = pts[sel]

  return (
    <div className="relative w-full h-full select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gdp-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#70B83E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#70B83E" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => {
          const y = toY(t)
          return (
            <g key={t}>
              <line
                x1={minX} y1={y} x2={maxX} y2={y}
                stroke="rgba(100,120,70,0.12)" strokeDasharray="4 5" strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text x={minX - 8} y={y + 3} textAnchor="end" fontSize={11} fill="#9aa38d" fontWeight={600}>
                {t}
              </text>
            </g>
          )
        })}

        <path d={area} fill="url(#gdp-chart-fill)" />
        <path
          d={path} fill="none" stroke="#70B83E" strokeWidth={3}
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        />

        {data.map((d, i) => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={10.5} fill="#9aa38d" fontWeight={600}>
            {d.label}
          </text>
        ))}
      </svg>

      {/* 数据节点（HTML 覆盖，保持正圆） */}
      {pts.map((p, i) => (
        <div
          key={i}
          onMouseEnter={() => setSel(i)}
          className="absolute"
          style={{
            left: `${(p.x / W) * 100}%`,
            top: `${(p.y / H) * 100}%`,
            transform: 'translate(-50%,-50%)',
            width: sel === i ? 14 : 9,
            height: sel === i ? 14 : 9,
            zIndex: sel === i ? 4 : 2,
          }}
        >
          {sel === i ? (
            <span className="block w-full h-full rounded-full bg-[#F2B632] border-[3px] border-white shadow-[0_2px_6px_rgba(80,110,40,0.35)]" />
          ) : (
            <span className="block w-full h-full rounded-full bg-white border-[3px] border-[#70B83E] shadow-sm" />
          )}
        </div>
      ))}

      {/* 浮动提示 */}
      <div
        className="gdp-chart-tip"
        style={{
          left: `${Math.min(Math.max((selPt.x / W) * 100, 10), 90)}%`,
          top: `${Math.max((selPt.y / H) * 100, 42)}%`,
          transform: 'translate(-50%, calc(-100% - 14px))',
        }}
      >
        <div className="font-bold text-[#3f3b2d]" style={{ fontSize: 11 }}>{data[sel].label}</div>
        <div style={{ fontSize: 11, color: '#7b9f43', fontWeight: 700 }}>
          记录 {data[sel].value} {unit}
        </div>
        <div className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#fffdf3]" />
      </div>
    </div>
  )
}
