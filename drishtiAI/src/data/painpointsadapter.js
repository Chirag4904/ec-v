// Several fields come back as JSON-encoded strings (e.g. a VARCHAR column
// storing '["a","b","c"]'), not real arrays — this parses them safely and
// falls back to an empty array rather than crashing the page if a field
// is ever malformed or missing.
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

const SEVERITY_MAP = {
  CRITICAL: { badge: 'crit', badgeLabel: 'CRITICAL' },
  WATCH: { badge: 'watch', badgeLabel: 'WATCH' },
  STABLE: { badge: 'stable', badgeLabel: 'STABLE' },
}

const PRIORITY_COLOR = {
  HIGH: '#E1793B',
  WATCH: '#F5B942',
  MONITOR: '#3FE0B5',
}

// api.js returns body.data, which for this endpoint is an array with one
// row in it (count: 1) — unwrap it once here so callers don't have to.
function firstRow(data) {
  return Array.isArray(data) ? data[0] : data
}

// Shape for the Overview pillar card (PillarCard.jsx)
export function pillarCardFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  const severity = SEVERITY_MAP[row.severity_status] ?? { badge: 'watch', badgeLabel: row.severity_status ?? 'WATCH' }
  const highlights = parseJsonArray(row.comparison_highlights)
  // comparison_highlights_json now carries a real detailApiPath per item —
  // not wired up to the drill-down modal yet (that's a separate, bigger
  // change: fetching real per-item data instead of the modal's seeded-random
  // placeholder charts) but the IDs are available whenever that's wanted.
  const highlightDetails = parseJsonArray(row.comparison_highlights_json)

  return {
    pillarIndex: 0,
    color: '#7C8CF5',
    badge: severity.badge,
    badgeLabel: severity.badgeLabel,
    eyebrow: 'Pain Points Summary',
    headline: row.page_headline,
    why: row.ai_summary,
    buckets: highlights.map((text, i) => ({ text, drillKey: null, detailApiPath: highlightDetails[i]?.detailApiPath ?? null })),
    askAI: row.suggested_chatbot_question,
  }
}

// Shape for the Pain Points detail page (PainPointsPane.jsx)
export function painPointsDetailFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  const chartItems = parseJsonArray(row.chart_data_json)

  return {
    plaqueHeadline: row.page_headline,
    aiSummary: row.ai_summary,
    highlightChips: parseJsonArray(row.comparison_highlights),
    // shareOfMonthlyComplaintsPct is an absolute share of ALL complaints
    // (so even the #1 item might only be ~23%) — normalized here relative
    // to the top item so bar lengths read the same way the other panes do,
    // rather than every bar looking short.
    comparisonBars: (() => {
      const shares = chartItems.map((it) => it.shareOfMonthlyComplaintsPct)
      const max = Math.max(...shares, 1)
      return chartItems.map((item) => ({
        label: item.label,
        pct: (item.shareOfMonthlyComplaintsPct / max) * 100,
        tag: item.trendDirection === 'RISING' ? 'Rising' : 'Declining',
        color: PRIORITY_COLOR[item.priorityStatus] ?? '#7C8CF5',
        tagColor: item.trendDirection === 'RISING' ? undefined : '#3FE0B5',
      }))
    })(),
    deepInsight: parseJsonArray(row.deep_insights),
    rootCause: row.root_cause,
    recommendations: parseJsonArray(row.recommendations),
    askAIPrompt: row.suggested_chatbot_question,
    generatedAt: row.generated_at,
    highestVolumeIssue: row.highest_volume_issue,
    fastestGrowingIssue: row.fastest_growing_issue,
  }
}