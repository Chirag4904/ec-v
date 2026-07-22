const PRIORITY_COLOR = {
  CRITICAL: '#FF6259',
  HIGH: '#E1793B',
  WATCH: '#F5B942',
  MONITOR: '#3FE0B5',
}

const CARD_KEY_COLOR = {
  PAIN_POINTS: '#7C8CF5',
  SENTIMENT: '#4FB6E8',
  CUSTOMER_VOICE_SENTIMENT: '#4FB6E8',
  SR_VOLUME: '#F5B942',
  SR_VOLUME_WORK_ORDERS: '#F5B942',
  FORECAST: '#E1793B',
}

function parseJsonField(value, fallback) {
  if (value == null) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function firstFinite(row, keys) {
  for (const key of Array.isArray(keys) ? keys : [keys]) {
    const value = Number(row?.[key])
    if (Number.isFinite(value)) return value
  }
  return null
}

function toBars(rows, labelKeys, pctKeys) {
  const labels = Array.isArray(labelKeys) ? labelKeys : [labelKeys]
  const pcts = Array.isArray(pctKeys) ? pctKeys : [pctKeys]
  if (!Array.isArray(rows)) return []
  return rows
    .map((r) => ({
      label: labels.map((key) => r?.[key]).find(Boolean),
      pct: firstFinite(r, pcts),
    }))
    .filter((r) => r.label && Number.isFinite(r.pct))
}

function humanizeToken(value) {
  return typeof value === 'string'
    ? value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''
}

function buildWeatherSummary(history, relationship) {
  const validHistory = Array.isArray(history)
    ? history.filter((row) => Number.isFinite(Number(row?.complaintVolumeUpliftPct)))
    : []
  const latest = validHistory[validHistory.length - 1] ?? null
  const strongest = validHistory.reduce((best, row) => (
    !best || Math.abs(row.complaintVolumeUpliftPct) > Math.abs(best.complaintVolumeUpliftPct) ? row : best
  ), null)
  if (!latest && !relationship) return null
  return {
    strength: relationship?.correlationStrength ?? null,
    direction: relationship?.correlationDirection ?? null,
    lagDays: relationship?.lagDays ?? null,
    latestPeriod: latest?.periodStart ?? null,
    latestEvent: humanizeToken(latest?.eventType),
    latestUpliftPct: firstFinite(latest, 'complaintVolumeUpliftPct'),
    strongestPeriod: strongest?.periodStart ?? null,
    strongestEvent: humanizeToken(strongest?.eventType),
    strongestUpliftPct: firstFinite(strongest, 'complaintVolumeUpliftPct'),
  }
}

// Transforms the real /api/dashboard/ai-highlights/{id} response into the
// shape DrillModal renders. This is real data — actual weekly complaint
// counts, actual channel/lifecycle/product/region splits — not the seeded-
// random placeholder the modal used before this endpoint existed.
export function highlightDetailFromApi(row) {
  if (!row) return null

  const metrics = parseJsonField(row.metric_summary_json, {})
  const trend = parseJsonField(row.trend_13_weeks_json, [])
  const weatherRelationship = parseJsonField(row.weather_relationship_json, null)
  const weatherHistory = parseJsonField(row.weather_history_json, [])
  const isSentiment = row.card_key === 'SENTIMENT' || row.card_key === 'CUSTOMER_VOICE_SENTIMENT'
  const isSrVolume = row.card_key === 'SR_VOLUME' || row.card_key === 'SR_VOLUME_WORK_ORDERS'
  const isForecast = row.card_key === 'FORECAST'

  return {
    title: row.label,
    color: PRIORITY_COLOR[row.priority_status] ?? CARD_KEY_COLOR[row.card_key] ?? '#7C8CF5',
    ctx: isForecast
      ? [metrics.issueName, metrics.leadingProductCategory, metrics.leadingChannel].filter(Boolean).join(' · ')
      : [metrics.productCategory, metrics.issueName ?? metrics.signalType].filter(Boolean).join(' · '),
    why: row.why_this_is_happening,
    trend: trend.map((t) => Number(isSentiment ? t.averageFeedbackScore : isSrVolume ? t.serviceRequestCount : t.complaintCount)).filter(Number.isFinite),
    trendFormat: isSentiment ? 'score' : 'number',
    trendLabel: isSentiment ? '13-week average score' : isSrVolume ? '13-week service requests' : isForecast ? '13-week complaint volume' : '13-week trend',
    trendWeeks: trend.map((t) => t.weekStart),
    byChannel: toBars(parseJsonField(row.by_channel_json, []), 'channel', isSentiment ? ['dissatisfiedRatePct', 'sharePct'] : isSrVolume ? ['serviceRequestContributionPct', 'sharePct'] : isForecast ? ['contributionPct', 'sharePct'] : 'sharePct'),
    byLifecycle: toBars(parseJsonField(row.by_lifecycle_json, []), 'lifecycle', isSentiment ? ['dissatisfiedRatePct', 'sharePct'] : isSrVolume ? ['serviceRequestContributionPct', 'sharePct'] : isForecast ? ['contributionPct', 'sharePct'] : 'sharePct'),
    byStatus: toBars(parseJsonField(row.by_status_json, []), 'status', 'sharePct'),
    byResolution: toBars(parseJsonField(row.by_resolution_json, []), ['resolution', 'resolutionStatus'], isSentiment ? ['dissatisfiedRatePct', 'sharePct'] : 'sharePct'),
    byProductCategory: toBars(parseJsonField(row.by_product_category_json, []), 'productCategory', isForecast ? ['contributionPct', 'sharePct'] : 'sharePct'),
    byRegion: toBars(parseJsonField(row.by_region_json, []), 'region', isForecast ? ['contributionPct', 'sharePct'] : 'sharePct'),
    recommendations: parseJsonField(row.recommendations_json, []),
    weatherSummary: isForecast ? buildWeatherSummary(weatherHistory, weatherRelationship) : null,
    contextNote: row.context_note,
    trendDirection: row.trend_direction,
    priorityStatus: row.priority_status,
    primaryMetrics: isSentiment
      ? [
        { label: 'Feedback Count', value: metrics.currentFeedbackCount, format: 'number' },
        { label: 'Previous Count', value: metrics.previousFeedbackCount, format: 'number' },
        { label: 'Avg Score MoM', value: metrics.averageScoreMomPct, format: 'pct', tone: metrics.averageScoreMomPct >= 0 ? 'text-teal' : 'text-red' },
        { label: 'Dissat. Change', value: metrics.dissatisfiedRateChangePp, format: 'pp', tone: metrics.dissatisfiedRateChangePp <= 0 ? 'text-teal' : 'text-red' },
      ]
      : isSrVolume
        ? [
          { label: 'Service Requests', value: metrics.currentServiceRequestCount, format: 'number' },
          { label: 'Previous Requests', value: metrics.previousServiceRequestCount, format: 'number' },
          { label: 'Requests MoM', value: metrics.serviceRequestMomPct, format: 'pct', tone: metrics.serviceRequestMomPct > 0 ? 'text-red' : 'text-teal' },
          { label: 'Resolution Rate', value: metrics.currentResolutionRatePct, format: 'pct' },
        ]
        : isForecast
          ? [
            { label: 'Current Volume', value: metrics.currentVolume, format: 'number' },
            { label: 'Projected Next', value: metrics.projectedNextMonthVolume, format: 'number' },
            { label: 'Projected Change', value: metrics.projectedChangePct, format: 'pct', tone: metrics.projectedChangePct > 0 ? 'text-red' : 'text-teal' },
            { label: '13-Week Change', value: metrics.thirteenWeekChangePct, format: 'pct', tone: metrics.thirteenWeekChangePct > 0 ? 'text-red' : 'text-teal' },
          ]
          : [
            { label: 'Complaint Count', value: metrics.complaintCount, format: 'number' },
            { label: 'Previous Month', value: metrics.previousMonthComplaintCount, format: 'number' },
            { label: 'MoM Growth', value: metrics.momGrowthPct, format: 'pct', tone: metrics.momGrowthPct > 0 ? 'text-red' : 'text-teal' },
            { label: '13-Week Change', value: metrics.thirteenWeekChangePct, format: 'pct', tone: metrics.thirteenWeekChangePct > 0 ? 'text-red' : 'text-teal' },
          ],
    secondaryMetrics: isSentiment
      ? [
        { label: 'First Week Score', value: metrics.firstWeekAverageScore, format: 'score' },
        { label: 'Latest Week Score', value: metrics.latestWeekAverageScore, format: 'score' },
      ]
      : isSrVolume
        ? [
          { label: 'Complaints', value: metrics.currentComplaintCount, format: 'number' },
          { label: 'Complaint Share', value: metrics.complaintSharePct, format: 'pct' },
          { label: 'Open Requests', value: metrics.currentOpenRequestCount, format: 'number' },
          { label: 'Avg TAT', value: metrics.averageResolutionTatHours, format: 'hours' },
        ]
        : isForecast
          ? [
            { label: 'Total 13 Weeks', value: metrics.total13WeekComplaints, format: 'number' },
            { label: 'First Week', value: metrics.firstWeekComplaintCount, format: 'number' },
            { label: 'Latest Week', value: metrics.latestWeekComplaintCount, format: 'number' },
            { label: 'Forecast Period', value: row.forecast_period ?? metrics.forecastStartPeriod, format: 'text' },
          ]
          : [
            { label: 'First Week', value: metrics.firstWeekCount, format: 'number' },
            { label: 'Latest Week', value: metrics.latestWeekCount, format: 'number' },
          ],
  }
}