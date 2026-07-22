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

function parseJsonSafe(value, fallback = null) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// This endpoint returns `data` as a single object, not an array (unlike
// pain-points-ai / sentiment-ai) — handle both shapes so this doesn't break
// if the backend ever changes to match the others.
function firstRow(data) {
  return Array.isArray(data) ? data[0] : data
}

// No severity_status field here either — derive one from the two
// direction-interpretation fields the view does provide.
function deriveSeverity(row) {
  const resolutionWorse = row.resolution_rate_direction_interpretation === 'DETERIORATION'
  const tatBetter = row.tat_direction_interpretation === 'IMPROVEMENT'
  if (resolutionWorse && !tatBetter) return { badge: 'crit', badgeLabel: 'CRITICAL' }
  if (resolutionWorse) return { badge: 'watch', badgeLabel: 'WATCH' } // mixed signal: resolution rate down, but TAT improving
  return { badge: 'stable', badgeLabel: 'STABLE' }
}

// Shape for the Overview pillar card (PillarCard.jsx)
export function pillarCardFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  const severity = deriveSeverity(row)
  const highlights = parseJsonArray(row.comparison_highlights)
  const highlightDetails = parseJsonArray(row.comparison_highlights_json)

  return {
    pillarIndex: 2,
    color: '#F5B942',
    badge: severity.badge,
    badgeLabel: severity.badgeLabel,
    eyebrow: 'SR Volume — Work Order Summary',
    headline: row.page_headline,
    why: row.ai_summary,
    buckets: highlights.map((text, i) => ({
      text,
      drillKey: null,
      detailApiPath: highlightDetails[i]?.detailApiPath ?? null,
    })),
    askAI: row.suggested_chatbot_question,
  }
}

// Shape for the SR Volume detail page (SrVolumePane.jsx)
export function srVolumeDetailFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  return {
    plaqueHeadline: row.page_headline,
    aiSummary: row.ai_summary,
    // No natural region/category breakdown in this payload (unlike
    // Sentiment's dissatisfied/neutral/satisfied) — instead using the two
    // real percentages the view does provide, plus total volume as the
    // 100% baseline they're both relative to.
    comparisonBars: [
      { label: 'Total Service Requests', pct: 100, tag: row.total_service_request_volume_trend === 'DECLINING' ? 'Declining' : 'Rising' },
      { label: 'Complaints (share of total)', pct: parseFloat(row.complaint_share_of_service_requests_pct), tag: row.complaint_volume_trend === 'DECLINING' ? 'Declining' : 'Rising' },
      {
        label: 'Resolution Rate', pct: parseFloat(row.resolution_rate_pct), tag: row.resolution_rate_direction_interpretation === 'DETERIORATION' ? 'Deteriorating' : 'Improving',
        tagColor: row.resolution_rate_direction_interpretation === 'DETERIORATION' ? '#E1793B' : '#3FE0B5'
      },
    ],
    deepInsight: parseJsonArray(row.deep_insights),
    rootCause: row.root_cause,
    recommendations: parseJsonArray(row.recommendations),
    askAIPrompt: row.suggested_chatbot_question,
    // Real 6-month trend series, same as Sentiment — not surfaced in the
    // UI yet, parsed and ready for a chart if/when one gets built.
    monthlyHistory: parseJsonSafe(row.monthly_history_json, []),
  }
}