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
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function firstRow(data) {
  return Array.isArray(data) ? data[0] : data
}

// No severity_status field in this payload (unlike Pain Points) — derive a
// reasonable one from the two trend directions until the view adds a real one.
function deriveSeverity(row) {
  const scoreDown = row.average_feedback_score_trend === 'DECLINING'
  const dissatUp = row.dissatisfied_rate_trend === 'RISING'
  if (scoreDown && dissatUp) return { badge: 'watch', badgeLabel: 'WATCH' }
  return { badge: 'stable', badgeLabel: 'STABLE' }
}

const trendWord = (trend, goodWhenRising) => {
  const rising = trend === 'RISING'
  const good = rising === goodWhenRising
  return { label: rising ? 'Rising' : 'Declining', good }
}

// Shape for the Overview pillar card (PillarCard.jsx)
export function pillarCardFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  const severity = deriveSeverity(row)
  const highlights = parseJsonArray(row.comparison_highlights)
  const highlightDetails = parseJsonArray(row.comparison_highlights_json)

  return {
    pillarIndex: 1,
    color: '#4FB6E8',
    badge: severity.badge,
    badgeLabel: severity.badgeLabel,
    eyebrow: 'Customer Voice — Sentiment Summary',
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

// Shape for the Customer Voice detail page (CustomerVoicePane.jsx)
export function sentimentDetailFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  const dissatisfied = trendWord(row.dissatisfied_rate_trend, false)
  const neutral = trendWord(row.neutral_rate_trend, false)
  const satisfied = trendWord(row.satisfied_rate_trend, true)

  return {
    plaqueHeadline: row.page_headline,
    aiSummary: row.ai_summary,
    // Real distribution, replaces the old hardcoded city-level bars —
    // pct drives bar length, tag is the trend direction only (no raw %,
    // consistent with the "no numbers on this chart" rule elsewhere).
    distribution: [
      { label: 'Dissatisfied', pct: parseFloat(row.dissatisfied_rate_pct), trend: dissatisfied },
      { label: 'Neutral', pct: parseFloat(row.neutral_rate_pct), trend: neutral },
      { label: 'Satisfied', pct: parseFloat(row.satisfied_rate_pct), trend: satisfied },
    ],
    deepInsight: parseJsonArray(row.deep_insights),
    rootCause: row.root_cause,
    recommendations: parseJsonArray(row.recommendations),
    askAIPrompt: row.suggested_chatbot_question,
    // 6-month real trend series — not surfaced in the UI yet, but real
    // (unlike the fake drill-down sparklines) and ready for a chart later.
    monthlyHistory: parseJsonSafe(row.monthly_history_json, []),
    disclosureNote: row.data_disclosure_note,
  }
}