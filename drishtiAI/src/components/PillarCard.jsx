const badgeClass = {
  crit: 'bg-red/[.15] text-red',
  watch: 'bg-amber/[.15] text-amber',
  monitor: 'bg-sky/[.15] text-sky',
}

const AiSparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z" />
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
    <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
  </svg>
)

// Trend chart for the Forecast pillar card — dashed line runs through history too
function ForecastTrendPreview() {
  return (
    <svg viewBox="0 0 640 140" className="w-full h-[100px] my-1">
      <line x1="420" y1="0" x2="420" y2="140" stroke="#ECEFE9" strokeDasharray="2 3" strokeOpacity=".25" />
      <text x="426" y="132" fontFamily="IBM Plex Mono" fontSize="9.5" fill="#57625B">TODAY</text>
      <path d="M20,90 L75,82 L130,88 L185,72 L240,65 L295,75 L350,60 L420,48" fill="none" stroke="#ECEFE9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20,95 L75,86 L130,84 L185,76 L240,70 L295,70 L350,55 L420,48 L490,32 L560,20 L620,10" fill="none" stroke="#F5A15C" strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Real version — actual line, then a dashed forecast line forward from
// today only (no retrospective overlay; that data doesn't exist yet).
function ForecastTrendReal({ chart }) {
  return (
    <svg viewBox={`0 0 ${chart.width} ${chart.height + 20}`} className="w-full h-[100px] my-1">
      <line x1={chart.todayX} y1="0" x2={chart.todayX} y2={chart.height} stroke="#ECEFE9" strokeDasharray="2 3" strokeOpacity=".25" />
      <text x={chart.todayX + 6} y={chart.height + 14} fontFamily="IBM Plex Mono" fontSize="9.5" fill="#57625B">TODAY</text>
      <path d={chart.actualPath} fill="none" stroke="#ECEFE9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={chart.backtestHistPath} fill="none" stroke="#F5A15C" strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" opacity=".75" />
      <path d={chart.forecastFuturePath} fill="none" stroke="#F5A15C" strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PillarCard({ card, onOpenDrill, onGoDeep, onAskAI }) {
  const handleBucketClick = (e, bucket) => {
    e.stopPropagation()

    const hasDrillKey = !!bucket.drillKey
    const hasDetailApiPath = !!bucket.detailApiPath
    const shouldOpenDrill = hasDrillKey || hasDetailApiPath

    console.log('[PillarCard] bucket click', {
      pillarIndex: card.pillarIndex,
      cardEyebrow: card.eyebrow,
      bucketText: bucket.text,
      drillKey: bucket.drillKey ?? null,
      detailApiPath: bucket.detailApiPath ?? null,
      hasDrillKey,
      hasDetailApiPath,
      pathTaken: shouldOpenDrill ? 'onOpenDrill' : 'onGoDeep',
      reason: shouldOpenDrill
        ? 'bucket has drillKey or detailApiPath'
        : 'bucket has neither drillKey nor detailApiPath',
    })

    if (shouldOpenDrill) {
      onOpenDrill(card.pillarIndex, bucket.drillKey, bucket.detailApiPath)
      return
    }

    onGoDeep(card.pillarIndex)
  }

  return (
    <div
      className="bg-panel border border-line rounded-xl shadow-card p-5 cursor-pointer hover:bg-panel2 hover:border-linebright transition-colors"
      style={{ borderLeft: `3px solid ${card.color}` }}
      onClick={() => onGoDeep(card.pillarIndex)}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wide" style={{ color: card.color }}>{card.eyebrow}</span>
        <span className={`ml-auto font-mono text-[9.5px] font-semibold px-[9px] py-1 rounded-full ${badgeClass[card.badge]}`}>{card.badgeLabel}</span>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-teal mb-2">
        <AiSparkleIcon /> AI Summary
      </div>

      <div className="font-display text-[17px] font-semibold leading-snug text-ink mb-1.5 max-w-[800px]">{card.headline}</div>
      <div className="text-[12.5px] leading-relaxed text-inksoft mb-3.5 max-w-[800px]">{card.why}</div>

      {card.hasTrendChart && (card.chart ? <ForecastTrendReal chart={card.chart} /> : <ForecastTrendPreview />)}

      <div className="flex gap-2.5 flex-wrap items-center">
        {card.buckets.map((b) => (
          <span
            key={b.text}
            className="font-sans text-[11px] text-inksoft bg-panel3 border border-line rounded-md px-[11px] py-1.5 cursor-pointer hover:bg-panel2 transition-colors"
            style={{ '--hover-border': card.color }}
            onClick={(e) => handleBucketClick(e, b)}
          >
            {b.text}
          </span>
        ))}
      </div>

      <div className="flex gap-2.5 mt-4">
        <span
          className="font-sans text-[11px] font-semibold px-[15px] py-2.5 rounded-lg bg-panel3 border border-linebright text-ink hover:bg-panel2 transition-colors"
          onClick={(e) => { e.stopPropagation(); onGoDeep(card.pillarIndex) }}
        >
          View Details →
        </span>
        <span
          className="flex items-center gap-1.5 font-sans text-[11px] font-semibold px-[15px] py-2.5 rounded-lg bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20 transition-colors"
          onClick={(e) => { e.stopPropagation(); onAskAI(card.askAI) }}
        >
          <ChatIcon /> Ask AI about this
        </span>
      </div>
    </div>
  )
}