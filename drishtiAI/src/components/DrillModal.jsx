import { useEffect, useState } from 'react'
import { getDrillContent, DRILL_PILLAR_LABELS } from '../data/drillData.js'
import { SparkChart, MiniBars, confWord, corrColor, corrWord } from './DrillCharts.jsx'
import { fetchHighlightDetail } from '../data/api.js'
import { highlightDetailFromApi } from '../data/highlightAdapter.js'
import { seriesToPath } from '../data/chartPath.js'
import { useDashboardFilters } from '../context/DashboardFiltersContext.jsx'

function RealTrendChart({ values, color, format = 'number' }) {
  const safeValues = values.filter(Number.isFinite)
  if (!safeValues.length) return null
  const fmt = (value) => format === 'score'
    ? value.toFixed(2)
    : new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  const { path, points } = seriesToPath(safeValues, { width: 640, height: 100, padTop: 10, padBottom: 10 })
  return (
    <svg viewBox="0 0 640 120" style={{ width: '100%', height: 130 }}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" y1={100 * f} x2="640" y2={100 * f} stroke="#1B211C" />
      ))}
      <path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => {
        const isEnd = i === points.length - 1
        const ty = p.y > 40 ? p.y - 10 : p.y + 16
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={isEnd ? 5 : 3} fill={isEnd ? color : '#0A0E0C'} stroke={color} strokeWidth="2" />
            <text x={p.x} y={ty} fontFamily="IBM Plex Mono" fontSize="9" fontWeight={isEnd ? 700 : 500} fill={isEnd ? color : '#96A199'} textAnchor="middle">
              {fmt(safeValues[i])}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function formatNumber(value) {
  return Number.isFinite(value) ? new Intl.NumberFormat('en-IN').format(value) : '—'
}

function formatPct(value) {
  return Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—'
}

function formatScore(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '—'
}

function formatPp(value) {
  return Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)} pp` : '—'
}

function formatHours(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} hrs` : '—'
}

function formatMetricValue(metric) {
  if (metric.format === 'text') return metric.value || '—'
  if (metric.format === 'score') return formatScore(metric.value)
  if (metric.format === 'pp') return formatPp(metric.value)
  if (metric.format === 'hours') return formatHours(metric.value)
  if (metric.format === 'pct') return formatPct(metric.value)
  return formatNumber(metric.value)
}

function RealBars({ rows, color }) {
  if (!rows.length) return null
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 mb-2.5">
          <span className="w-[110px] font-sans text-[11px] text-inkfaint flex-shrink-0 whitespace-nowrap overflow-hidden text-ellipsis">{r.label}</span>
          <div className="flex-1 h-2.5 bg-panel3 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: color }} />
          </div>
          <span className="w-[52px] text-right font-mono text-[11px] font-semibold text-ink">{r.pct.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  )
}

function MetricTile({ label, value, tone = 'text-ink' }) {
  return (
    <div className="bg-panel2 border border-line rounded-[10px] p-4">
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-2">{label}</div>
      <div className={`font-display text-[18px] font-semibold ${tone}`}>{value}</div>
    </div>
  )
}

export default function DrillModal({ open, pillarIndex, drillKey, detailApiPath, onClose, onGoDeep }) {
  const { filters } = useDashboardFilters()
  const [realData, setRealData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!open || !detailApiPath) {
      setRealData(null)
      setFetchError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(null)
    fetchHighlightDetail(detailApiPath, filters)
      .then((row) => {
        if (cancelled) return
        setRealData(highlightDetailFromApi(row))
      })
      .catch((err) => {
        console.error('Failed to load real highlight detail, falling back to placeholder:', err.message)
        if (cancelled) return
        setFetchError(err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, detailApiPath, filters.product_category, filters.region])

  if (!open || pillarIndex == null || (!drillKey && !detailApiPath)) return null

  // Real data takes priority whenever it loaded successfully; otherwise
  // fall back to the legacy placeholder content — but only if there's an
  // actual drillKey to look up (buckets backed purely by detailApiPath
  // have drillKey: null, so there's nothing to fall back to if the fetch
  // fails or is still loading).
  const usingReal = !!realData
  const legacy = !usingReal && drillKey ? getDrillContent(pillarIndex, drillKey) : null
  const hasContent = usingReal || !!legacy
  const color = realData?.color ?? legacy?.color ?? '#7C8CF5'
  const title = realData?.title ?? legacy?.title
  const ctx = realData?.ctx ?? legacy?.ctx
  const why = realData?.why ?? legacy?.why

  return (
    <div
      className="fixed inset-0 bg-[rgba(6,9,7,.72)] backdrop-blur-[2px] z-[900] flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-panel2 border border-linebright rounded-2xl max-w-[880px] w-full max-h-[88vh] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-line sticky top-0 bg-panel2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wide" style={{ color }}>
                {DRILL_PILLAR_LABELS[pillarIndex]}
              </span>
              {!loading && (
                <span className={`font-mono text-[8.5px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${usingReal ? 'text-teal bg-teal/10' : 'text-inkfaint bg-panel3'}`}>
                  {usingReal ? 'live data' : 'placeholder'}
                </span>
              )}
            </div>
            <div className="font-display text-[17px] font-semibold text-ink mt-1 max-w-[460px]">{title}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg border border-linebright bg-panel text-inksoft hover:bg-panel3 hover:text-ink flex-shrink-0 text-sm">
            ✕
          </button>
        </div>

        <div className="px-[22px] py-5">
          {loading ? (
            <div className="text-center py-10">
              <span className="font-mono text-[11px] text-inkfaint">Loading real data…</span>
            </div>
          ) : !hasContent ? (
            <div className="text-center py-10">
              <span className="font-mono text-[11px] text-copper">{fetchError ? `Could not load detail: ${fetchError}` : 'No detail available for this item yet.'}</span>
            </div>
          ) : (
            <>
              <div className="font-mono text-xs text-inkfaint mb-1.5">{ctx}</div>

              <div className="bg-indigo/[.08] border-l-[3px] border-indigo rounded-r-lg px-4 py-3.5 my-3.5">
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-indigo mb-2">◆ Why this is happening</div>
                <div className="text-[13.5px] leading-relaxed text-ink">{why}</div>
              </div>

              {usingReal && realData.primaryMetrics.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
                  {realData.primaryMetrics.map((metric) => (
                    <MetricTile key={metric.label} label={metric.label} value={formatMetricValue(metric)} tone={metric.tone} />
                  ))}
                </div>
              )}

              <div className="bg-panel2 border border-line rounded-[10px] p-4 mb-3.5">
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">{realData?.trendLabel ?? '13-week trend'}</div>
                {usingReal
                  ? <RealTrendChart values={realData.trend} color={color} format={realData.trendFormat} />
                  : <SparkChart dataKey={drillKey} bias={legacy.bias} color={color} />}
              </div>

              {usingReal ? (
                <>
                  {realData.secondaryMetrics.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                      {realData.secondaryMetrics.map((metric) => (
                        <MetricTile key={metric.label} label={metric.label} value={formatMetricValue(metric)} tone={metric.tone} />
                      ))}
                    </div>
                  )}
                  {realData.weatherSummary && (
                    <div className="bg-panel2 border border-line rounded-[10px] p-4 mb-3.5">
                      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">Weather context</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[11.5px] text-inksoft">
                        <div>Correlation · <span className="text-ink">{[realData.weatherSummary.strength, realData.weatherSummary.direction].filter(Boolean).join(' ') || '—'}</span></div>
                        <div>Lag · <span className="text-ink">{realData.weatherSummary.lagDays != null ? `${realData.weatherSummary.lagDays} day` : '—'}</span></div>
                        <div>Latest proxy month · <span className="text-ink">{[realData.weatherSummary.latestPeriod?.slice(0, 7), realData.weatherSummary.latestEvent].filter(Boolean).join(' · ') || '—'}</span></div>
                        <div>Strongest uplift · <span className="text-ink">{realData.weatherSummary.strongestEvent ? `${realData.weatherSummary.strongestEvent} · ${formatPct(realData.weatherSummary.strongestUpliftPct)}` : '—'}</span></div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                    {realData.byChannel.length > 0 && (
                      <div className="bg-panel2 border border-line rounded-[10px] p-4">
                        <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By channel</div>
                        <RealBars rows={realData.byChannel} color={color} />
                      </div>
                    )}
                    {realData.byLifecycle.length > 0 && (
                      <div className="bg-panel2 border border-line rounded-[10px] p-4">
                        <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By lifecycle stage</div>
                        <RealBars rows={realData.byLifecycle} color={color} />
                      </div>
                    )}
                    {realData.byStatus.length > 0 && (
                      <div className="bg-panel2 border border-line rounded-[10px] p-4">
                        <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By status</div>
                        <RealBars rows={realData.byStatus} color={color} />
                      </div>
                    )}
                    {realData.byResolution.length > 0 && (
                      <div className="bg-panel2 border border-line rounded-[10px] p-4">
                        <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By resolution</div>
                        <RealBars rows={realData.byResolution} color={color} />
                      </div>
                    )}
                    {realData.byProductCategory.length > 0 && (
                      <div className="bg-panel2 border border-line rounded-[10px] p-4">
                        <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By product category</div>
                        <RealBars rows={realData.byProductCategory} color={color} />
                      </div>
                    )}
                    {realData.byRegion.length > 0 && (
                      <div className="bg-panel2 border border-line rounded-[10px] p-4">
                        <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By region</div>
                        <RealBars rows={realData.byRegion} color={color} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                  <div className="bg-panel2 border border-line rounded-[10px] p-4">
                    <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By channel</div>
                    <MiniBars dataKey={drillKey + 'ch'} labels={['Call Center', 'CRM/Store', 'Marketplace', 'Social']} color={color} />
                  </div>
                  <div className="bg-panel2 border border-line rounded-[10px] p-4">
                    <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-inkfaint mb-3">By lifecycle stage</div>
                    <MiniBars dataKey={drillKey + 'lc'} labels={['Usage', 'Service', 'Installation', 'Post-Service']} color={color} />
                  </div>
                </div>
              )}

              {usingReal && realData.contextNote && (
                <div className="font-mono text-[10px] text-inkfaint mb-3.5">{realData.contextNote}</div>
              )}

              {!usingReal && (
                <table className="w-full border-collapse mb-3.5">
                  <thead>
                    <tr>
                      <th className="font-mono text-[9.5px] uppercase text-inkfaint text-left pb-2 border-b border-line">Also connected to</th>
                      <th className="font-mono text-[9.5px] uppercase text-inkfaint text-left pb-2 border-b border-line">Strength</th>
                      <th className="font-mono text-[9.5px] uppercase text-inkfaint text-left pb-2 border-b border-line">What it means</th>
                    </tr>
                  </thead>
                  <tbody>
                    {legacy.corr.map((c, i) => {
                      const rNum = parseFloat(c[1])
                      const word = isNaN(rNum) ? c[1] : corrWord(rNum)
                      const cc = isNaN(rNum) ? { bg: 'rgba(255,255,255,.06)', fg: '#96A199' } : corrColor(rNum)
                      return (
                        <tr key={i}>
                          <td className="text-[11.5px] text-inksoft py-2.5 border-b border-line/50">{c[0]}</td>
                          <td className="py-2.5 border-b border-line/50">
                            <span className="inline-block min-w-[90px] text-center px-2 py-0.5 rounded-md font-mono font-semibold text-[11px]" style={{ background: cc.bg, color: cc.fg }}>
                              {word}
                            </span>
                          </td>
                          <td className="text-[11.5px] text-inksoft py-2.5 border-b border-line/50">{c[2]}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              <div className="bg-tealsoft border border-teal/30 rounded-panel px-5 py-[18px]">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-teal">✦ Recommendation{usingReal && realData.recommendations.length > 1 ? 's' : ''}</span>
                  {!usingReal && <span className="font-mono text-[10px] font-semibold text-teal bg-teal/[.15] px-2 py-1 rounded-full">{confWord(legacy.conf)}</span>}
                </div>
                {usingReal ? (
                  <ul className="flex flex-col gap-2">
                    {realData.recommendations.map((r, i) => (
                      <li key={i} className="text-[13px] leading-relaxed text-ink">{'\u2022'} {r}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[13px] leading-relaxed text-ink">{legacy.rec}</div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-[22px] pb-5">
          <span
            className="font-mono text-[10.5px] font-semibold cursor-pointer"
            style={{ color }}
            onClick={() => { onClose(); onGoDeep(pillarIndex) }}
          >
            See full analysis for this area →
          </span>
        </div>
      </div>
    </div>
  )
}