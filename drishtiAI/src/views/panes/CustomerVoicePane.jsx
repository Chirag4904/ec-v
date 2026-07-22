import { useEffect, useState } from 'react'
import { Plaque, ReportSection, ReportText, RecList, ChatCTA, NextLink, CompareRow } from './shared.jsx'
import { fetchSentimentAi } from '../../data/api.js'
import { sentimentDetailFromApi } from '../../data/sentimentAdapter.js'
import { useDashboardFilters } from '../../context/DashboardFiltersContext.jsx'

const MOCK = {
  plaqueHeadline: 'Customer sentiment is holding steady nationally, but Delhi NCR is pulling satisfaction down faster than anywhere else this month — the same pattern showing up in both NPS and CSAT.',
  aiSummary: "NPS and CSAT are both softening in Delhi NCR while holding steady everywhere else — Pune and Bangalore currently have the strongest customer sentiment of any city. Social sentiment on Locobuzz and review platforms is showing the same regional pattern, and it's moving a few days ahead of the formal survey scores.",
  distribution: [
    { label: 'Pune', pct: 100, trend: { label: 'Strongest', good: true } },
    { label: 'Bangalore', pct: 85, trend: { label: 'Strong', good: true } },
    { label: 'Kolkata', pct: 50, trend: { label: 'Softening', good: false } },
    { label: 'Delhi NCR', pct: 20, trend: { label: 'Weakest', good: false } },
  ],
  deepInsight: [
    'Resolution time and customer satisfaction move together more closely than any other pair of signals we track — when TAT worsens in a region, both NPS and CSAT reliably follow within days. Complaint volume tracks the same pattern, which means all three are really describing one underlying issue in Delhi NCR, not three separate ones.',
    "Social sentiment tends to shift a few days before formal survey responses and service tickets catch up to the same issue — customers talk about a problem publicly before they file it formally or respond to a CSAT survey. That gives an early-warning window that's currently underused.",
    "CSAT and NPS aren't moving in perfect lockstep, though, and that gap is worth reading carefully: CSAT reflects satisfaction with the specific service interaction, while NPS reflects overall brand loyalty. Delhi NCR's CSAT is softening faster than its NPS right now, which suggests customers are still willing to give the brand the benefit of the doubt even as they're unhappy with this particular installation experience — a window that narrows the longer the resolution time issue persists.",
    "By channel, the sentiment decline is most visible on review platforms and social channels rather than in direct survey responses, reinforcing that customers are more likely to vent publicly first. Pune and Bangalore's stronger sentiment correlates with their comparatively faster resolution times, which is further evidence this is a TAT-driven pattern rather than a product or brand-perception issue specific to Delhi NCR.",
  ],
  rootCause: "Sentiment isn't declining on its own — it's a downstream effect of the same technician capacity gap driving Delhi NCR's installation backlog. Resolution time is the common driver behind both complaint volume and satisfaction; fixing it should lift NPS and CSAT together without needing a separate customer-experience initiative.",
  recommendations: [
    'Treat resolution time as the priority lever for Delhi NCR sentiment recovery, not a separate CX campaign — fixing it should move NPS, CSAT, and complaint volume together.',
    'Start monitoring social sentiment as a genuine early-warning signal for satisfaction scores — it consistently moves first.',
    'Prioritize resolution-time fixes on the longest-open tickets in Delhi NCR first — that\u2019s where the sentiment impact is largest.',
    'Benchmark Delhi NCR\u2019s resolution time against Pune and Bangalore — the two strongest-sentiment cities — to size the gap concretely.',
  ],
  askAIPrompt: 'How much would fixing Delhi NCR resolution time improve NPS and CSAT, based on the historical relationship between the two?',
}

const DIST_COLOR = { Dissatisfied: '#E1793B', Neutral: '#F5B942', Satisfied: '#3FE0B5', Pune: '#3FE0B5', Bangalore: '#3FE0B5', Kolkata: '#F5B942', 'Delhi NCR': '#E1793B' }

export default function CustomerVoicePane({ onNext, onAskAI }) {
  const { filters } = useDashboardFilters()
  const [d, setD] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setD(null)
    setError(null)
    fetchSentimentAi(filters)
      .then((data) => {
        if (cancelled) return
        const detail = sentimentDetailFromApi(data)
        if (!detail) throw new Error('Sentiment AI response was empty')
        setD(detail)
      })
      .catch((err) => {
        console.error('Failed to load live Customer Voice detail, falling back to mock:', err.message)
        if (cancelled) return
        setError(err.message)
        setD(MOCK)
      })
    return () => { cancelled = true }
  }, [filters.product_category, filters.region])

  if (!d) {
    return (
      <div className="bg-panel border border-line rounded-panel p-[26px] text-center">
        <span className="font-mono text-[11px] text-inkfaint">Loading Customer Voice detail…</span>
      </div>
    )
  }

  return (
    <div>
      <Plaque color="#4FB6E8" headline={d.plaqueHeadline} />
      <div className="bg-panel border border-line border-t-0 rounded-b-panel p-[26px]">

        {error && (
          <div className="mb-4 font-mono text-[10px] font-medium text-copper">LIVE DATA UNAVAILABLE · SHOWING MOCK CONTENT</div>
        )}
        {d.disclosureNote && (
          <div className="mb-4 font-mono text-[10px] text-inkfaint">{d.disclosureNote}</div>
        )}

        <ReportSection kind="ai" title="AI Summary">
          <ReportText>{d.aiSummary}</ReportText>
          <div className="mt-4">
            {d.distribution.map((row) => (
              <CompareRow
                key={row.label}
                label={row.label}
                pct={row.pct}
                color={DIST_COLOR[row.label] ?? '#4FB6E8'}
                tag={row.trend.label}
                tagColor={row.trend.good ? '#3FE0B5' : undefined}
              />
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