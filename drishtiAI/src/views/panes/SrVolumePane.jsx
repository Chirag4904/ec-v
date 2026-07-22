import { useEffect, useState } from 'react'
import { Plaque, ReportSection, ReportText, RecList, ChatCTA, NextLink, CompareRow } from './shared.jsx'
import { fetchSrVolumeAi } from '../../data/api.js'
import { srVolumeDetailFromApi } from '../../data/srVolumeAdapter.js'
import { useDashboardFilters } from '../../context/DashboardFiltersContext.jsx'

const MOCK = {
  plaqueHeadline: 'North region is generating more service work orders than any other region right now, and the gap is growing week over week as the pre-monsoon demand shift begins.',
  aiSummary: "Call volume is rising fastest in North region, well ahead of Central and South, while East is actually trending down. Backlog overall is trending in the right direction, but that North region spike is large enough to reverse that if staffing doesn't shift ahead of it.",
  comparisonBars: [
    { label: 'North', pct: 100, tag: 'Highest' },
    { label: 'Central', pct: 55, tag: 'Medium' },
    { label: 'South', pct: 30, tag: 'Low' },
    { label: 'East', pct: 18, tag: 'Improving', tagColor: '#3FE0B5' },
  ],
  deepInsight: [
    "The North region increase tracks the pre-monsoon demand shift — cooling and water heater service requests both rise as temperatures climb, and this year's early heatwave has pulled that pattern forward. Weather-adjusted forecasting attributes a meaningful share of the projected spike directly to monsoon-linked demand, not to a service quality issue or a one-off event.",
    "East region's decline is a separate story — monsoon onset simply reaches that region later in the season, so the near-term picture there is genuinely calmer, not a data gap.",
    "Breaking the North spike down by category, Installation-related work orders are growing fastest, consistent with the same technician capacity gap showing up in the Pain Points pillar — this isn't an isolated service-volume trend, it's connected to the installation backlog story. Product Defect and Delivery-related work orders are rising too, but at a slower pace.",
    "On current staffing, service level and first-contact resolution are both holding at acceptable levels today — the risk isn't that North is already struggling, it's that the forecasted spike is large enough to erode that margin within the next few weeks if capacity isn't shifted ahead of it.",
  ],
  rootCause: "This is a forecastable, weather-driven demand shift rather than an operational breakdown — current staffing levels were set before this year's early heatwave was flagged, so the plan simply hasn't caught up with the signal yet. The good news is the lead time: this pattern is visible with enough runway to rebalance staffing before it turns into backlog.",
  recommendations: [
    'Rebalance technician and call-center staffing toward North region 10\u201314 days ahead of the forecasted spike — the weather signal gives enough lead time to shift capacity before backlog builds.',
    'Consider temporarily reallocating East region capacity toward North while the seasonal gap between the two regions persists.',
    'Hold Central and South staffing steady — their forecasted change is modest and doesn\u2019t warrant a shift yet.',
    'Re-check the forecast weekly through the pre-monsoon window — the North region pattern can move quickly once temperatures cross the seasonal threshold.',
  ],
  askAIPrompt: 'How many additional technicians does North region need this week to stay ahead of the forecasted call volume spike?',
}

export default function SrVolumePane({ onNext, onAskAI }) {
  const { filters } = useDashboardFilters()
  const [d, setD] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setD(null)
    setError(null)
    fetchSrVolumeAi(filters)
      .then((data) => {
        if (cancelled) return
        const detail = srVolumeDetailFromApi(data)
        if (!detail) throw new Error('SR Volume AI response was empty')
        setD(detail)
      })
      .catch((err) => {
        console.error('Failed to load live SR Volume detail, falling back to mock:', err.message)
        if (cancelled) return
        setError(err.message)
        setD(MOCK)
      })
    return () => { cancelled = true }
  }, [filters.product_category, filters.region])

  if (!d) {
    return (
      <div className="bg-panel border border-line rounded-panel p-[26px] text-center">
        <span className="font-mono text-[11px] text-inkfaint">Loading SR Volume detail…</span>
      </div>
    )
  }

  return (
    <div>
      <Plaque color="#F5B942" headline={d.plaqueHeadline} />
      <div className="bg-panel border border-line border-t-0 rounded-b-panel p-[26px]">

        {error && (
          <div className="mb-4 font-mono text-[10px] font-medium text-copper">LIVE DATA UNAVAILABLE · SHOWING MOCK CONTENT</div>
        )}

        <ReportSection kind="ai" title="AI Summary">
          <ReportText>{d.aiSummary}</ReportText>
          <div className="mt-4">
            {d.comparisonBars.map((row) => (
              <CompareRow key={row.label} label={row.label} pct={row.pct} color="#F5B942" tag={row.tag} tagColor={row.tagColor} />
            ))}
          </div>
        </ReportSection>

        <ReportSection kind="deep" title="Deep Insight">
          {d.deepInsight.map((para, i) => <ReportText key={i}>{para}</ReportText>)}
        </ReportSection>

        <ReportSection kind="root" title="Root Cause">
          <ReportText>{d.rootCause}</ReportText>
        </ReportSection>

        <ReportSection kind="rec" title="Recommendations">
          <RecList items={d.recommendations} />
        </ReportSection>

        <ChatCTA
          text={`Ask Drishti directly — e.g. "${d.askAIPrompt}"`}
          question={d.askAIPrompt}
          onAskAI={onAskAI}
        />
      </div>
      <NextLink onClick={onNext} />
    </div>
  )
}