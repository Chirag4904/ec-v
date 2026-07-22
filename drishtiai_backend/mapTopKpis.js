// Add this to server.js and call it inside the /api/dashboard/top-kpis route:
//   const rows = await fetchView(TOP_KPI_VIEW)
//   return res.json({ success: true, data: mapTopKpis(rows) })

// Targets aren't in the Databricks view — they're business-set constants,
// so they live here until there's a better source for them.
const TARGETS = {
  'Service NPS': null,        // no target until the NPS-vs-satisfaction question is resolved
  'Average Resolution TAT': 17.2,
  'Ticket Volume': null,      // no natural "target" for a volume metric
  'Customer Pain Index': null,
}

function toLakh(n) {
  if (n == null) return null
  return `${(n / 100000).toFixed(1)}L`
}

function arrow(momGrowthPct) {
  const n = parseFloat(momGrowthPct)
  if (isNaN(n) || n === 0) return ''
  return n > 0 ? '\u2191' : '\u2193'
}

function formatDelta(row) {
  const pct = parseFloat(row.mom_growth_pct)
  if (isNaN(pct)) return ''
  const sign = pct > 0 ? '+' : ''
  const decimals = Math.abs(pct) < 0.1 && pct !== 0 ? 2 : 1
  return `${arrow(row.mom_growth_pct)} ${sign}${pct.toFixed(decimals)}% MoM`
}

function painIndexLabel(score) {
  if (score >= 60) return 'Critical \u2014 needs immediate attention'
  if (score >= 30) return 'Elevated \u2014 monitor closely'
  return 'Stable'
}

function byMetricName(rows, name) {
  return rows.find((r) => r.metric_name === name)
}

function toIntOrNull(v) {
  if (v == null) return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

function footerTextOrFallback(row, fallback = '') {
  if (!row?.footer_text) return fallback
  return String(row.footer_text)
}

function mapTopKpis(rows) {
  const nps = byMetricName(rows, 'Service NPS')
  const tat = byMetricName(rows, 'Average Resolution TAT')
  const tickets = byMetricName(rows, 'Ticket Volume')
  const pain = byMetricName(rows, 'Customer Pain Index')

  return {
    // Still not real NPS — metric_value is a 1-5 satisfaction score,
    // scaled x2 to display on a 0-10 range by the view itself (see
    // business_note). More honest than the raw 1-5 value, but still not
    // standard NPS. Keep the warning until there's a real NPS source.
    serviceNps: nps
      ? {
        rawValue: parseFloat(nps.metric_value), // now 0-10 scale
        rawUnit: nps.unit, // "SCORE_0_TO_10"
        delta: formatDelta(nps),
        ctx: footerTextOrFallback(nps, `${toLakh(parseFloat(nps.denominator_value))} responses`),
        warning: 'metric_value is a 1-5 satisfaction score scaled x2 for display \u2014 not standard NPS, do not present as-is on the NPS gauge',
      }
      : null,

    avgTat: tat
      ? {
        value: Math.round(parseFloat(tat.metric_value) * 10) / 10, // hours
        delta: formatDelta(tat),
        ctx: footerTextOrFallback(
          tat,
          TARGETS['Average Resolution TAT']
            ? `target ${TARGETS['Average Resolution TAT']} hrs`
            : '',
        ),
      }
      : null,

    ticketVolume: tickets
      ? {
        value: Math.round(parseFloat(tickets.metric_value)), // now total volume, not just open/backlog
        delta: formatDelta(tickets),
        ctx: footerTextOrFallback(tickets, '18 cities \u00b7 closed, cancelled & open'),
        breakdown: [
          { label: 'Closed', value: toIntOrNull(tickets.closed_ticket_count)?.toLocaleString() ?? '\u2014' },
          { label: 'Open', value: toIntOrNull(tickets.open_ticket_count)?.toLocaleString() ?? '\u2014' },
          { label: 'Cancelled', value: toIntOrNull(tickets.cancelled_ticket_count)?.toLocaleString() ?? '\u2014' },
        ],
      }
      : null,

    painIndex: pain
      ? {
        value: Math.round(parseFloat(pain.metric_value)),
        delta: formatDelta(pain),
        label: painIndexLabel(parseFloat(pain.metric_value)),
        ctx: footerTextOrFallback(pain, '0\u2013100 composite \u00b7 updated daily'),
      }
      : null,
  }
}

module.exports = { mapTopKpis }