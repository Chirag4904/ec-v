import { seriesToPath, bandToPath } from './chartPath.js'

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
  if (value && typeof value === 'object') return value
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

const CONFIDENCE_MAP = {
  HIGH_CONFIDENCE: { badge: 'stable', badgeLabel: 'HIGH CONFIDENCE' },
  MEDIUM_CONFIDENCE: { badge: 'watch', badgeLabel: 'MEDIUM CONFIDENCE' },
  LOW_CONFIDENCE: { badge: 'crit', badgeLabel: 'LOW CONFIDENCE' },
}

const PRIORITY_COLOR = {
  HIGH_VOLUME_AND_RISING: '#E1793B',
  WATCH: '#F5B942',
  MONITOR: '#3FE0B5',
}

/**
 * Real trust chart: solid actual line + dashed BACKTEST line running
 * through the same historical months (monthly_chart_json, modelValueType
 * "BACKTEST"), then continuing as the real forward forecast
 * (monthly_forecast_json) with its confidence band. This is the version
 * originally intended — a prior payload didn't include backtest data, so
 * an earlier build had to fake a "forward only" version. Now it doesn't.
 */
export function buildForecastChart(chartRows, forecastRows, { width = 640, height = 200, recentMonths = 12 } = {}) {
  const historical = chartRows
    .filter((r) => !r.isForecastPeriod)
    .slice(-recentMonths)
    // first month in the whole series has modelValue 0 (nothing to backtest
    // against yet) — drop any zero-model-value point so the backtest line
    // doesn't dip to zero at the edge of the visible window
    .filter((r) => !(r.modelValue === 0 && r === chartRows[0]))

  const actualValues = historical.map((r) => r.actualValue)
  const backtestValues = historical.map((r) => r.modelValue)

  const forecastMid = forecastRows.map((r) => r.forecast_service_request_volume)
  const forecastLo = forecastRows.map((r) => r.forecast_service_request_lower_bound)
  const forecastHi = forecastRows.map((r) => r.forecast_service_request_upper_bound)

  const totalPoints = actualValues.length + forecastMid.length
  const stepX = totalPoints > 1 ? width / (totalPoints - 1) : 0
  const allValues = [...actualValues, ...backtestValues, ...forecastLo, ...forecastHi, ...forecastMid]
  const valueRange = [Math.min(...allValues), Math.max(...allValues)]

  const forecastStartX = (actualValues.length - 1) * stepX

  const { path: actualPath } = seriesToPath(actualValues, { width: forecastStartX, height, valueRange, startX: 0 })

  // Backtest line spans the SAME historical window as actuals — this is
  // the part that lets someone visually check "did the model's own past
  // predictions track what really happened" before trusting the future part.
  const { path: backtestHistPath } = seriesToPath(backtestValues, { width: forecastStartX, height, valueRange, startX: 0 })

  const lastActual = actualValues[actualValues.length - 1]
  const forecastSeries = [lastActual, ...forecastMid]
  const forecastLoSeries = [lastActual, ...forecastLo]
  const forecastHiSeries = [lastActual, ...forecastHi]

  const { path: forecastFuturePath } = seriesToPath(forecastSeries, { width: width - forecastStartX, height, valueRange, startX: forecastStartX })
  const bandPath = bandToPath(forecastLoSeries, forecastHiSeries, { width: width - forecastStartX, height, valueRange, startX: forecastStartX })

  return {
    actualPath,
    // Two separate dashed segments, not force-joined into one path — the
    // backtest line ends at the model's *predicted* value for the last
    // historical month, which isn't necessarily identical to the *actual*
    // value the forecast line starts from. Styling them identically (same
    // dash pattern/color) makes them read as continuous without claiming
    // a false precise join.
    backtestHistPath,
    forecastFuturePath,
    bandPath,
    todayX: forecastStartX,
    width,
    height,
    valueRange,
    latestActualValue: lastActual,
    forecastEndValue: forecastMid[forecastMid.length - 1],
  }
}

export function pillarCardFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  const confidence = CONFIDENCE_MAP[row.confidence_status] ?? { badge: 'watch', badgeLabel: row.confidence_status ?? 'WATCH' }
  const highlights = parseJsonArray(row.comparison_highlights)
  const highlightDetails = parseJsonArray(row.comparison_highlights_json)
  const chartRows = parseJsonArray(row.monthly_chart_json)
  const forecastRows = parseJsonArray(row.monthly_forecast_json)

  return {
    pillarIndex: 3,
    color: '#E1793B',
    badge: confidence.badge,
    badgeLabel: confidence.badgeLabel,
    eyebrow: 'Forecast — Volume',
    headline: row.page_headline,
    why: row.ai_summary,
    buckets: highlights.map((text, i) => ({
      text,
      drillKey: null,
      detailApiPath: highlightDetails[i]?.detailApiPath ?? null,
    })),
    askAI: row.suggested_chatbot_question,
    hasTrendChart: true,
    chart: chartRows.length && forecastRows.length
      ? buildForecastChart(chartRows, forecastRows, { width: 640, height: 100, recentMonths: 8 })
      : null,
  }
}

export function forecastPageFromApi(data) {
  const row = firstRow(data)
  if (!row) return null

  const chartRows = parseJsonArray(row.monthly_chart_json)
  const forecastRows = parseJsonArray(row.monthly_forecast_json)
  const categoryProjections = parseJsonArray(row.category_projection_json)
  const weatherRelationship = parseJsonSafe(row.weather_relationship_json, null)

  // shares are normalized relative to the top item so bar lengths read
  // consistently with the rest of the app (same approach as Pain Points)
  const maxVolume = Math.max(...categoryProjections.map((c) => c.currentVolume), 1)

  return {
    plaqueHeadline: row.page_headline,
    aiSummary: row.ai_summary,
    deepInsight: parseJsonArray(row.deep_insights),
    rootCause: row.root_cause,
    recommendations: parseJsonArray(row.recommendations),
    askAIPrompt: row.suggested_chatbot_question,
    confidenceStatus: row.confidence_status,
    // weather_signal_available is specifically about the volume-forecast
    // MODEL not using weather as an input feature — that's still false.
    // But there IS now real historical weather-correlation data (below),
    // just correlational, not causal, per the disclosure note.
    weatherInForecastModel: row.weather_signal_available === 'true' || row.weather_signal_available === true,
    weatherDisclosureNote: row.weather_disclosure_note,
    weatherRelationship: weatherRelationship
      ? {
        strength: weatherRelationship.correlationStrength, // e.g. "MODERATE"
        direction: weatherRelationship.correlationDirection, // e.g. "POSITIVE"
        lagDays: weatherRelationship.lagDays,
        isProxy: weatherRelationship.implementationStatus === 'PROXY',
      }
      : null,
    forecastMethodNote: row.forecast_method_note,
    latestActualPeriod: row.latest_actual_period,
    forecastStartPeriod: row.forecast_start_period,
    forecastEndPeriod: row.forecast_end_period,
    categoryProjections: categoryProjections.map((c) => ({
      label: c.issueName,
      pct: (c.currentVolume / maxVolume) * 100,
      tag: c.trendDirection === 'RISING' ? 'Rising' : 'Declining',
      color: PRIORITY_COLOR[c.priorityStatus] ?? '#E1793B',
      tagColor: c.trendDirection === 'RISING' ? undefined : '#3FE0B5',
    })),
    chart: chartRows.length && forecastRows.length
      ? buildForecastChart(chartRows, forecastRows, { width: 900, height: 220, recentMonths: 12 })
      : null,
  }
}