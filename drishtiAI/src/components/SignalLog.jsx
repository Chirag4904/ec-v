import { useEffect, useState } from 'react'
import { SIGNAL_GROUPS } from '../data/dashboardData.js'
import { fetchEarlyWarningFeed } from '../data/api.js'

const sevColor = { hi: 'text-red', med: 'text-copper', low: 'text-amber' }
const groupColor = { copper: 'text-copper', teal: 'text-teal' }
const bucketColor = { UPCOMING_RISK: 'copper', NEEDS_ATTENTION_NOW: 'teal' }
const severityMap = { HIGH: 'hi', MEDIUM: 'med', LOW: 'low' }

function adaptFeedRows(rows) {
  const groups = new Map()
  rows.forEach((row) => {
    const key = row.warning_bucket ?? row.bucket_title ?? 'OTHER'
    if (!groups.has(key)) {
      groups.set(key, {
        label: row.bucket_title ?? key.toLowerCase().replace(/_/g, ' '),
        sub: row.bucket_description ?? '',
        color: bucketColor[row.warning_bucket] ?? 'teal',
        order: Number(row.bucket_display_order ?? row.bucket_order ?? 999),
        items: [],
      })
    }
    groups.get(key).items.push({
      order: Number(row.display_order ?? 999),
      ts: row.time_label?.startsWith('[') ? row.time_label : `[${row.time_label}]`,
      sev: severityMap[row.severity] ?? 'med',
      text: [row.headline, row.detail].filter(Boolean).join(' — '),
      action: row.recommended_action ?? 'Review signal',
    })
  })
  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map((group) => ({ ...group, items: group.items.sort((a, b) => a.order - b.order) }))
}

export default function SignalLog() {
  const [groups, setGroups] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchEarlyWarningFeed()
      .then((rows) => {
        if (cancelled) return
        setGroups(adaptFeedRows(rows))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load early warning feed, falling back to mock data:', err.message)
        setError(err.message)
        setGroups(SIGNAL_GROUPS)
      })
    return () => { cancelled = true }
  }, [])

  const renderedGroups = groups ?? []
  const total = renderedGroups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div className="mt-7 bg-[#080B09] border border-line rounded-panel overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-[11px] border-b border-line bg-panel">
        <div className="flex gap-[5px]">
          <span className="w-[7px] h-[7px] rounded-full bg-linebright" />
          <span className="w-[7px] h-[7px] rounded-full bg-linebright" />
          <span className="w-[7px] h-[7px] rounded-full bg-linebright" />
        </div>
        <span className="font-mono text-[10.5px] font-semibold tracking-wide uppercase text-inksoft">Signal Log — Early Warning Feed</span>
        <span className="ml-auto font-mono text-[10px] font-semibold text-copper bg-coppersoft px-2 py-1 rounded">{groups ? `${total} ACTIVE` : 'LOADING'}</span>
      </div>
      <div className="px-[18px] pt-3.5 pb-[18px] font-mono text-[12.5px] leading-[2] text-inksoft">
        {!groups ? (
          <div className="text-inkfaint">Loading early warning feed…</div>
        ) : (
          renderedGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
              <div className="text-inkfaint font-semibold tracking-wide">
                # <span className={groupColor[group.color]}>{group.label}</span> — {group.sub}
              </div>
              {group.items.map((row, i) => (
                <div key={i}>
                  <span className="text-inkfaint">{row.ts}</span> <span className={sevColor[row.sev]}>●</span> {row.text} → <span className="text-teal">{row.action}</span>
                </div>
              ))}
            </div>
          ))
        )}
        {error && <div className="text-copper">Live feed unavailable — showing fallback log.</div>}
        <div className="text-inkfaint">root@drishti:~$ <span className="text-teal caret">▊</span></div>
      </div>
    </div>
  )
}
