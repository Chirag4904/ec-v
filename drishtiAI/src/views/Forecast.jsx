import { useEffect, useState } from 'react'
import { ReportSection, ReportText, RecList, ChatCTA, CompareRow } from './panes/shared.jsx'
import { fetchForecastAi } from '../data/api.js'
import { forecastPageFromApi } from '../data/forecastAdapter.js'
import { useDashboardFilters } from '../context/DashboardFiltersContext.jsx'

function fmt(n) {
  if (n == null) return '\u2014'
  return Math.round(n).toLocaleString()
}
function fmtMonth(period) {
  if (!period) return ''
  const d = new Date(period)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
function titleCase(s) {
  return s?.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
}

export default function Forecast({ onGoDeep, onAskAI }) {
  const { filters } = useDashboardFilters()
  const [d, setD] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setD(null)
    setError(null)
    fetchForecastAi(filters)
      .then((data) => {
        if (cancelled) return
        const page = forecastPageFromApi(data)
        if (!page) throw new Error('Forecast AI response was empty')
        setD(page)
      })
      .catch((err) => {
        console.error('Failed to load live Forecast data:', err.message)
        if (cancelled) return
        setError(err.message)
      })
    return () => { cancelled = true }
  }, [filters.product_category, filters.region])

  if (error) {
    return (
      <section className="view-enter max-w-[1280px] mx-auto px-[30px] pb-[70px]">
        <div className="bg-panel border border-line rounded-panel p-[26px] text-center">
          <span className="font-mono text-[11px] text-copper">Could not load live Forecast data: {error}</span>
        </div>
      </section>
    )
  }

  if (!d) {
    return (
      <section className="view-enter max-w-[1280px] mx-auto px-[30px] pb-[70px]">
        <div className="bg-panel border border-line rounded-panel p-[26px] text-center">
          <span className="font-mono text-[11px] text-inkfaint">Loading Forecast…</span>
        </div>
      </section>
    )
  }

  const c = d.chart
  const w = d.weatherRelationship

  return (
    <section className="view-enter max-w-[1280px] mx-auto px-[30px] pb-[70px]">
      <div className="bg-panel border border-line rounded-t-panel px-[26px] py-[22px]" style={{ borderLeft: '3px solid #E1793B' }}>
        <div className="font-mono text-[10px] font-semibold tracking-widest uppercase mb-2.5 text-copper">What's coming</div>
        <div className="font-display text-[20px] font-semibold leading-snug text-ink max-w-[760px]">{d.plaqueHeadline}</div>
      </div>

      <div className="bg-panel border border-line border-t-0 rounded-b-panel p-[26px]">

        {c && (
          <div className="mb-[30px]">
            <div className="flex justify-between items-end mb-3.5">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink">Service request volume — actual vs. model (history) &amp; forecast</h3>
                <p className="font-mono text-[10.5px] text-inkfaint mt-1">
                  Through {fmtMonth(d.latestActualPeriod)} · {fmtMonth(d.forecastStartPeriod)}\u2013{fmtMonth(d.forecastEndPeriod)} forecast · {titleCase(d.confidenceStatus)}
                </p>
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-inksoft"><span className="w-3.5 h-0.5 bg-ink inline-block" /> Actual</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-inksoft"><span className="w-3.5 border-t-2 border-dashed border-copper inline-block" /> Model (backtest + forecast)</span>
              </div>
            </div>
            <svg viewBox={`0 0 ${c.width} ${c.height + 30}`} className="w-full" style={{ height: c.height + 30 }}>
              <line x1="0" y1="20" x2={c.width} y2="20" stroke="#1B211C" />
              <line x1="0" y1={c.height / 2 + 10} x2={c.width} y2={c.height / 2 + 10} stroke="#1B211C" />
              <line x1="0" y1={c.height} x2={c.width} y2={c.height} stroke="#1B211C" />
              <text x="0" y="16" fontFamily="IBM Plex Mono" fontSize="9.5" fill="#57625B">{fmt(c.valueRange[1])}</text>
              <text x="0" y={c.height} fontFamily="IBM Plex Mono" fontSize="9.5" fill="#57625B">{fmt(c.valueRange[0])}</text>
              <path d={c.bandPath} fill="#E1793B" opacity=".12" />
              <path d={c.actualPath} fill="none" stroke="#ECEFE9" strokeWidth="2.4" strokeLinecap="round" />
              <path d={c.backtestHistPath} fill="none" stroke="#E1793B" strokeWidth="2.4" strokeDasharray="6 5" strokeLinecap="round" opacity=".75" />
              <path d={c.forecastFuturePath} fill="none" stroke="#E1793B" strokeWidth="2.4" strokeDasharray="6 5" strokeLinecap="round" />
              <line x1={c.todayX} y1="0" x2={c.todayX} y2={c.height} stroke="#ECEFE9" strokeDasharray="2 3" strokeOpacity=".25" />
              <text x={c.todayX + 6} y={c.height + 20} fontFamily="IBM Plex Mono" fontSize="10.5" fill="#57625B">TODAY \u00b7 {fmt(c.latestActualValue)}</text>
              <text x={c.width - 6} y="18" fontFamily="IBM Plex Mono" fontSize="10.5" fill="#E1793B" textAnchor="end">{fmtMonth(d.forecastEndPeriod)} \u00b7 {fmt(c.forecastEndValue)}</text>
            </svg>
            <div className="mt-2 mb-3.5">
              <span className="text-xs text-inksoft">{d.forecastMethodNote} The lighter dashed segment on the left is the model's own historical backtest — how closely it tracked reality before, which is why the solid forecast segment on the right can be trusted.</span>
            </div>
          </div>
        )}

        <ReportSection kind="ai" title="AI Summary">
          <ReportText>{d.aiSummary}</ReportText>
        </ReportSection>

        <ReportSection kind="deep" title="Deep Insight">
          {d.deepInsight.map((para, i) => <ReportText key={i}>{para}</ReportText>)}
          {d.categoryProjections.length > 0 && (
            <div className="mt-4">
              <div className="font-mono text-[9.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">Projected next-month volume, by issue</div>
              {d.categoryProjections.map((row) => (
                <CompareRow key={row.label} label={row.label} pct={row.pct} color={row.color} tag={row.tag} tagColor={row.tagColor} />
              ))}
            </div>
          )}
        </ReportSection>

        <ReportSection kind="root" title="Root Cause">
          <ReportText>{d.rootCause}</ReportText>
        </ReportSection>

        <div className="bg-panel2 border border-dashed border-linebright rounded-lg px-4 py-3 mb-[30px]">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-wide text-inkfaint mb-1.5">Weather context</div>
          <div className="text-xs text-inksoft">{d.weatherDisclosureNote}</div>
          {w && (
            <div className="text-xs text-inksoft mt-1.5">
              Historical data shows a <b className="text-ink">{w.strength?.toLowerCase()}, {w.direction?.toLowerCase()}</b> correlation between temperature and complaint volume{w.lagDays ? ` (${w.lagDays}-day lag)` : ''} — {w.isProxy ? 'proxy data, ' : ''}correlational, not used as a direct input to this forecast model.
            </div>
          )}
        </div>

        <div className="bg-panel2 border border-dashed border-linebright rounded-xl px-5 py-4 mb-[30px] flex items-center justify-between gap-4">
          <div className="text-[12.5px] text-inksoft max-w-[520px]">
            <b className="text-ink">Service request volume is one part of the picture</b> — see the full work-order breakdown and resolution-rate detail.
          </div>
          <button onClick={() => onGoDeep(2)} className="flex items-center gap-1.5 bg-amber/10 border border-amber/35 text-amber font-sans text-[11.5px] font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap hover:bg-amber/20 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            View Service &amp; Call Volume
          </button>
        </div>

        <ReportSection kind="rec" title="Recommendations">
          <RecList items={d.recommendations} />
        </ReportSection>

        <ChatCTA
          text={`Ask Drishti directly — e.g. "${d.askAIPrompt}"`}
          question={d.askAIPrompt}
          onAskAI={onAskAI}
        />
      </div>
    </section>
  )
}