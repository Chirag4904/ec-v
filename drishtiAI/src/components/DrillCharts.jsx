import { seed, srand } from '../data/drillData.js'

export function sparkPoints(sd, w, h, bias) {
  const pts = []
  for (let i = 0; i < 8; i++) {
    const r = srand(sd + i * 7.3)
    const drift = bias * (i / 7) * 0.5
    const v = 0.5 + (r - 0.5) * 0.5 + drift * 0.5
    const yFrac = Math.max(0.08, Math.min(0.95, v))
    const val = Math.round(60 + yFrac * 80)
    pts.push({ x: (w / 7) * i, y: h - yFrac * h, val })
  }
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
  return { path, pts }
}

export function SparkChart({ dataKey, w = 640, h = 100, bias, color }) {
  const { path, pts } = sparkPoints(seed(dataKey), w, h, bias)
  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} style={{ width: '100%', height: 130 }}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="#1B211C" />
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const isEnd = i === pts.length - 1
        const above = p.y > h * 0.4
        const ty = above ? p.y - 12 : p.y + 20
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={isEnd ? 5 : 3.5} fill={isEnd ? color : '#0A0E0C'} stroke={color} strokeWidth="2" />
            <text x={p.x} y={ty} fontFamily="IBM Plex Mono" fontSize="10" fontWeight={isEnd ? 700 : 500} fill={isEnd ? color : '#96A199'} textAnchor="middle">
              {p.val}
            </text>
          </g>
        )
      })}
      <text x={pts[pts.length - 1].x} y={16} fontFamily="IBM Plex Mono" fontSize="10" fontWeight="600" fill={color} textAnchor="end">NOW</text>
    </svg>
  )
}

export function MiniBars({ dataKey, labels, color }) {
  return (
    <div>
      {labels.map((lb, i) => {
        const pct = 30 + srand(seed(dataKey) + i * 3.1) * 70
        return (
          <div key={lb} className="flex items-center gap-2 mb-2.5">
            <span className="w-[88px] font-sans text-[11px] text-inkfaint flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis">{lb}</span>
            <div className="flex-1 h-2.5 bg-panel3 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct.toFixed(0)}%`, background: color }} />
            </div>
            <span className="w-[34px] text-right font-mono text-[11px] font-semibold text-ink">{pct.toFixed(0)}%</span>
          </div>
        )
      })}
    </div>
  )
}

export function corrColor(r) {
  const n = Math.abs(r)
  if (n >= 0.75) return { bg: 'rgba(79,182,232,.22)', fg: '#4FB6E8' }
  if (n >= 0.55) return { bg: 'rgba(79,182,232,.14)', fg: '#7CC7E8' }
  return { bg: 'rgba(255,255,255,.06)', fg: '#96A199' }
}
export function corrWord(r) {
  const n = Math.abs(r)
  if (n >= 0.75) return 'Strong link'
  if (n >= 0.55) return 'Moderate link'
  return 'Weak link'
}
export function confWord(pct) {
  if (pct >= 75) return 'High confidence'
  if (pct >= 55) return 'Medium confidence'
  return 'Low confidence'
}

// Comparison bar row — word label leads, number follows (e.g. "Highest · 1,120")
export function CompareRow({ label, pct, color, tag, tagColor }) {
  return (
    <div className="grid grid-cols-[150px_1fr_120px] items-center gap-2.5 mb-2.5">
      <span className="text-[11.5px] text-inksoft">{label}</span>
      <div className="h-2 bg-panel3 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-[11.5px] font-semibold text-right" style={{ color: tagColor || 'var(--color-ink)' }}>{tag}</span>
    </div>
  )
}
