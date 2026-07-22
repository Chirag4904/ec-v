// priority_status values seen so far: CRITICAL. WATCH/STABLE aren't in the
// sample data yet but are handled here so the UI doesn't break the day they
// show up — anything unrecognized falls back to 'watch' rather than crashing.
const STATUS_MAP = {
  CRITICAL: { badge: 'crit', badgeLabel: 'CRITICAL' },
  WATCH: { badge: 'watch', badgeLabel: 'WATCH' },
  STABLE: { badge: 'stable', badgeLabel: 'STABLE' },
}

export function priorityAreasFromApi(rows) {
  return rows
    .map((row) => {
      const status = STATUS_MAP[row.priority_status] ?? { badge: 'watch', badgeLabel: row.priority_status ?? 'WATCH' }
      return {
        rank: parseInt(row.priority_rank, 10),
        name: row.priority_title,
        share: `${parseFloat(row.share_of_volume_pct).toFixed(2)}%`,
        badge: status.badge,
        badgeLabel: status.badgeLabel,
        // The view has no concept of "which pillar" — these are all
        // complaint-category issues, so default to Pain Points (0) for now.
        // Revisit if a real category-to-pillar mapping is ever needed.
        pillarIndex: 0,
      }
    })
    .sort((a, b) => a.rank - b.rank)
}