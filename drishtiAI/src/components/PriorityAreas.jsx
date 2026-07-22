import { useEffect, useState } from 'react'
import { PRIORITY_AREAS as MOCK_PRIORITY_AREAS } from '../data/dashboardData.js'
import { fetchPriorityAreas } from '../data/api.js'
import { priorityAreasFromApi } from '../data/priorityAreasAdapter.js'

const badgeClass = {
  crit: 'bg-red/[.15] text-red',
  watch: 'bg-amber/[.15] text-amber',
  stable: 'bg-teal/[.15] text-teal',
}

export default function PriorityAreas({ onGoDeep }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchPriorityAreas()
      .then((data) => {
        if (cancelled) return
        setRows(priorityAreasFromApi(data))
      })
      .catch((err) => {
        console.error('Failed to load live Priority Areas, falling back to mock data:', err.message)
        if (cancelled) return
        setError(err.message)
        setRows(MOCK_PRIORITY_AREAS)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="bg-panel border border-line rounded-xl shadow-card px-5 py-[18px]">
      <div className="flex justify-between items-baseline mb-2.5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink">Priority Areas</h3>
        {error ? (
          <span className="font-mono text-[9.5px] font-medium text-copper" title={error}>LIVE DATA UNAVAILABLE · SHOWING MOCK</span>
        ) : (
          <span className="font-mono text-[10px] text-inkfaint">AUTO-RANKED BY SHARE OF VOLUME + SEVERITY + GROWTH</span>
        )}
      </div>

      {!rows ? (
        <div className="py-6 text-center font-mono text-[11px] text-inkfaint">Loading priority areas…</div>
      ) : (
        rows.map((row) => (
          <div
            key={row.rank}
            onClick={() => onGoDeep(row.pillarIndex)}
            className="grid grid-cols-[22px_1fr_auto] items-start gap-3 py-[10px] border-t border-line cursor-pointer group"
          >
            <span className="font-mono text-[11px] font-semibold text-inkfaint pt-0.5">{row.rank}</span>
            <div className="min-w-0">
              <div className="font-sans text-xs text-ink group-hover:text-teal transition-colors">{row.name}</div>
              <div className="font-mono text-[10px] text-inkfaint mt-1">{row.subtitle}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 font-mono text-[10.5px] text-inksoft">
                <span>{row.complaintCount} complaints</span>
                <span>{row.share}</span>
                <span className={row.growthTone}>{row.momGrowth}</span>
              </div>
            </div>
            <span className={`font-mono text-[9px] font-semibold px-2 py-1 rounded-full whitespace-nowrap mt-0.5 ${badgeClass[row.badge]}`}>{row.badgeLabel}</span>
          </div>
        ))
      )}
    </div>
  )
}