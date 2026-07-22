// Ranges below define what "full gauge" means for metrics that aren't
// naturally 0-100. These are placeholders until the business defines real
// ceilings — flagged here rather than buried in the calculation.
const RANGE_MAX = {
  serviceNps: 10,        // now displayed 0-10 (view scales the 1-5 raw score x2) — still not real NPS
  avgTat: 48,             // hours; arbitrary ceiling, confirm with business
  ticketVolume: 1200000,  // raised to fit the real total (~658K, prior period ~1.02M) — still arbitrary, confirm with business
}

// Which direction is "good" per metric, used only to pick gauge color —
// doesn't affect the needle position, which is always magnitude-based.
const GOOD_DIRECTION = {
  serviceNps: 'up',
  avgTat: 'down',
  ticketVolume: 'down',
  painIndex: 'down',
}

const TEAL = '#3FE0B5'
const COPPER = '#E1793B'
const AMBER = '#F5B942' // reserved for Pain Index's own "Elevated" state, not a generic bad-direction color

function pctFromRange(value, max) {
  if (value == null || !max) return 0
  return Math.max(0, Math.min(100, (value / max) * 100))
}

function colorFor(metricKey, deltaStr) {
  const direction = deltaStr?.startsWith('\u2191') ? 'up' : deltaStr?.startsWith('\u2193') ? 'down' : null
  if (!direction) return TEAL
  return direction === GOOD_DIRECTION[metricKey] ? TEAL : COPPER
}

// Pain Index gets its color from the absolute level (via its label).
function painColor(label) {
  if (label?.startsWith('Critical')) return '#FF6259'
  if (label?.startsWith('Elevated')) return AMBER
  return TEAL
}

export function gaugesFromApi(data) {
  const gauges = []

  if (data.painIndex) {
    const g = data.painIndex
    gauges.push({
      label: 'Customer Pain Index',
      value: g.value,
      pct: g.value, // already 0-100
      color: painColor(g.label),
      delta: g.label,
      ctx: g.ctx,
    })
  }

  if (data.serviceNps) {
    const g = data.serviceNps
    gauges.push({
      label: 'Service NPS',
      hint: '',
      value: g.rawValue.toFixed(1),
      pct: pctFromRange(g.rawValue, RANGE_MAX.serviceNps),
      color: colorFor('serviceNps', g.delta),
      delta: g.delta,
      ctx: g.ctx,
    })
  }

  if (data.avgTat) {
    const g = data.avgTat
    gauges.push({
      label: 'Avg TAT',
      value: g.value,
      unit: 'hrs',
      pct: pctFromRange(g.value, RANGE_MAX.avgTat),
      color: colorFor('avgTat', g.delta),
      delta: g.delta,
      ctx: g.ctx,
    })
  }

  if (data.ticketVolume) {
    const g = data.ticketVolume
    gauges.push({
      label: 'Ticket Volume',
      value: g.value.toLocaleString(),
      pct: pctFromRange(g.value, RANGE_MAX.ticketVolume),
      color: colorFor('ticketVolume', g.delta),
      delta: g.delta,
      ctx: g.ctx,
      // breakdown comes straight through from the backend now that the
      // Databricks view includes open/closed/cancelled counts \u2014 the
      // fallback to null just protects against a future response missing it
      breakdown: g.breakdown ?? null,
    })
  }

  return gauges
}