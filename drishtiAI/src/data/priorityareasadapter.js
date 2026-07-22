// priority_status values seen so far: CRITICAL. WATCH/STABLE aren't in the
// sample data yet but are handled here so the UI doesn't break the day they
// show up — anything unrecognized falls back to 'watch' rather than crashing.
const STATUS_MAP = {
  CRITICAL: { badge: 'crit', badgeLabel: 'CRITICAL' },
  HIGH: { badge: 'watch', badgeLabel: 'HIGH' },
  WATCH: { badge: 'watch', badgeLabel: 'WATCH' },
  MEDIUM: { badge: 'stable', badgeLabel: 'MEDIUM' },
  STABLE: { badge: 'stable', badgeLabel: 'STABLE' },
}

const numFmt = new Intl.NumberFormat('en-IN')

export function priorityAreasFromApi(rows) {
  return rows
    .map((row) => {
      const status = STATUS_MAP[row.priority_status] ?? { badge: 'watch', badgeLabel: row.priority_status ?? 'WATCH' }
      const complaintCount = Number(row.complaint_count)
      const share = Number(row.share_of_volume_pct)
      const momGrowth = Number(row.mom_growth_pct)
      return {
        rank: parseInt(row.priority_rank, 10),
        name: row.priority_title,
        subtitle: row.display_subtitle ?? `Top category: ${row.top_product_category}`,
        complaintCount: Number.isFinite(complaintCount) ? numFmt.format(Math.round(complaintCount)) : '—',
        share: Number.isFinite(share) ? `${share.toFixed(2)}% share` : '—',
        momGrowth: Number.isFinite(momGrowth) ? `${momGrowth >= 0 ? '↑' : '↓'} ${Math.abs(momGrowth).toFixed(2)}% MoM` : '—',
        growthTone: momGrowth > 0 ? 'text-copper' : 'text-teal',
        badge: status.badge,
        badgeLabel: status.badgeLabel,
        pillarIndex: 0,
      }
    })
    .sort((a, b) => a.rank - b.rank)
}