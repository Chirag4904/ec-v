import { useEffect, useState } from 'react'
import { GAUGES as MOCK_GAUGES } from '../data/dashboardData.js'
import { fetchTopKpis } from '../data/api.js'
import { gaugesFromApi } from '../data/kpiAdapter.js'
import { useTooltip } from '../context/TooltipContext.jsx'
import { useDashboardFilters } from '../context/DashboardFiltersContext.jsx'

function polarArc(pct) {
  const cx = 80, cy = 88, r = 66
  const ang = Math.PI * (1 - pct / 100)
  const ex = (cx + r * Math.cos(ang)).toFixed(1)
  const ey = (cy - r * Math.sin(ang)).toFixed(1)
  const len = (r * Math.PI * (pct / 100)).toFixed(1)
  const nr = 54.17
  const nx = (cx + nr * Math.cos(ang)).toFixed(1)
  const ny = (cy - nr * Math.sin(ang)).toFixed(1)
  return { ex, ey, len, nx, ny }
}

function Gauge({ g, delay }) {
  // console.log('rendering gauge',)
  const { showTip, moveTip, hideTip } = useTooltip()
  const { ex, ey, len, nx, ny } = polarArc(g.pct)
  const hasBreakdown = !!g.breakdown
  // console.log('gauge', g.label, g.pct, g.color, hasBreakdown, g.breakdown)

  const handlers = hasBreakdown
    ? {
        onMouseEnter: (e) =>
          showTip(
            e,
            <>
              <span className="tip-lbl block font-mono text-[9.5px] uppercase text-inkfaint mb-1.5">{g.label} — breakdown</span>
              {g.breakdown.map((b) => (
                <div key={b.label}>{b.label}: <b className="text-ink">{b.value}</b></div>
              ))}
            </>
          ),
        onMouseMove: moveTip,
        onMouseLeave: hideTip,
      }
    : {}

  return (
    <div className="text-center px-2 pt-2.5 pb-1" style={{ cursor: hasBreakdown ? 'help' : 'default' }} {...handlers}>
      <svg viewBox="0 0 160 100" className="w-full">
        <path d="M14.0,88.0 A66,66 0 1 1 146.0,88.0" fill="none" stroke="#232A25" strokeWidth="9" strokeLinecap="round" />
        <path
          className="gauge-arc"
          style={{ '--len': `${len}px`, '--gdelay': `${delay}s` }}
          d={`M14.0,88.0 A66,66 0 0 1 ${ex},${ey}`}
          fill="none" stroke={g.color} strokeWidth="9" strokeLinecap="round"
        />
        <line
          className="gauge-needle"
          style={{ '--rot': `${(180 * (1 - g.pct / 100)).toFixed(1)}deg`, '--gdelay': `${delay}s` }}
          x1="80" y1="88" x2={nx} y2={ny} stroke="#ECEFE9" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="80" cy="88" r="4" fill="#ECEFE9" />
      </svg>
      <div className="font-sans text-[11px] font-semibold text-inksoft">
        {g.label} {g.hint && <span className="opacity-50 font-normal">{g.hint}</span>}
      </div>
      <div className="font-mono text-2xl font-semibold mt-0.5" style={{ color: g.color }}>
        {g.value}{g.unit && <span className="text-[13px]">{g.unit}</span>}
      </div>
      <div className="font-mono text-[11px] mt-0.5" style={{ color: g.color }}>{g.delta}</div>
      <div className="font-mono text-[10px] text-inkfaint mt-0.5">{g.ctx}</div>
    </div>
  )
}

export default function InstrumentCluster() {
  const { filters } = useDashboardFilters()
  const [gauges, setGauges] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setGauges(null)
    setError(null)
    fetchTopKpis(filters)
      .then((data) => {
        if (cancelled) return
        setGauges(gaugesFromApi(data))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load live KPIs, falling back to mock data:', err.message)
        setError(err.message)
        setGauges(MOCK_GAUGES)
      })
    return () => { cancelled = true }
  }, [filters.product_category, filters.region])

  return (
    <div className="bg-panel border border-line rounded-xl shadow-card relative pt-[16px] px-6 pb-3.5 mb-2">
      <span className="absolute w-1 h-1 rounded-full bg-white/[.09] top-2 left-2" />
      <span className="absolute w-1 h-1 rounded-full bg-white/[.09] top-2 right-2" />
      <span className="absolute w-1 h-1 rounded-full bg-white/[.09] bottom-2 left-2" />
      <span className="absolute w-1 h-1 rounded-full bg-white/[.09] bottom-2 right-2" />

      <div className="flex justify-between items-center mb-1.5">
        <span className="font-mono text-[10px] font-semibold tracking-[1px] uppercase text-inkfaint">Key Metrics Overview</span>
        
      </div>

      {!gauges ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 py-8">
          <span className="col-span-full text-center font-mono text-[11px] text-inkfaint">Loading KPIs…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          {gauges.map((g, i) => (
            <Gauge key={g.label} g={g} delay={i * 0.12} />
          ))}
        </div>
      )}
    </div>
  )
}