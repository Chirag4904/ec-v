import { useEffect, useState } from 'react'
import { RECOMMENDED_ACTIONS } from '../data/dashboardData.js'
import { fetchRecommendedActions } from '../data/api.js'

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3 h-3">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

function parseJsonArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function pillarIndexFromHighlightId(id) {
  if (id?.startsWith('pain_')) return 0
  if (id?.startsWith('sentiment_')) return 1
  if (id?.startsWith('sr_')) return 2
  if (id?.startsWith('forecast_')) return 3
  return null
}

function adaptLiveActions(rows) {
  return rows
    .map((row) => {
      const evidenceIds = parseJsonArray(row.evidence_highlight_ids_json || row.evidence_highlight_ids)
      const highlightId = evidenceIds[0] ?? null
      return {
        id: row.action_id,
        text: row.display_text || [row.action_title, row.action_detail].filter(Boolean).join(' — '),
        pillarIndex: pillarIndexFromHighlightId(highlightId),
        drillKey: null,
        detailApiPath: highlightId ? `/api/dashboard/ai-highlights/${highlightId}` : null,
      }
    })
    .filter((item) => item.text)
}

function adaptMockActions(rows) {
  return rows.map((item, index) => ({
    id: `mock-${index}`,
    text: item.text,
    pillarIndex: item.pillarIndex,
    drillKey: item.drillKey,
    detailApiPath: null,
  }))
}

export default function RecommendedActions({ onOpenDrill }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchRecommendedActions()
      .then((rows) => {
        if (cancelled) return
        setItems(adaptLiveActions(rows))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load recommended actions, falling back to mock data:', err.message)
        setError(err.message)
        setItems(adaptMockActions(RECOMMENDED_ACTIONS))
      })
    return () => { cancelled = true }
  }, [])

  const renderedItems = items ?? []

  return (
    <div className="bg-panel border border-line rounded-xl shadow-card px-5 py-[18px]">
      <div className="flex justify-between items-baseline mb-2.5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink">Recommended Actions</h3>
        <span className="font-mono text-[10px] text-inkfaint">{items ? "PULLED FROM THIS WEEK'S AI ANALYSIS" : 'LOADING LIVE ACTIONS'}</span>
      </div>
      {!items ? (
        <div className="font-mono text-[11px] text-inkfaint py-[11px]">Loading recommended actions…</div>
      ) : (
        renderedItems.map((item, i) => (
          <div
            key={item.id}
            onClick={() => item.pillarIndex != null && onOpenDrill(item.pillarIndex, item.drillKey, item.detailApiPath)}
            className={`flex items-start gap-[11px] py-[11px] ${item.pillarIndex != null ? 'cursor-pointer group' : ''} ${i > 0 ? 'border-t border-line' : ''}`}
          >
            <div className="w-[22px] h-[22px] rounded-md bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-teal">
              <CheckIcon />
            </div>
            <div className="font-sans text-xs leading-relaxed text-inksoft transition-colors group-hover:text-ink">{item.text}</div>
          </div>
        ))
      )}
      {error && <div className="font-mono text-[10px] text-copper mt-1">Live actions unavailable — showing fallback items.</div>}
    </div>
  )
}
