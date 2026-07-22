import { useEffect, useState } from 'react'
import { Plaque, ReportSection, ReportText, RecList, ChatCTA, NextLink, CompareRow } from './shared.jsx'
import { fetchPainPointsAi } from '../../data/api.js'
import { painPointsDetailFromApi } from '../../data/painPointsAdapter.js'
import { useDashboardFilters } from '../../context/DashboardFiltersContext.jsx'

const MOCK = {
  plaqueHeadline: 'Water Heaters are generating more installation-related complaints than any other product this month, and the gap is widening — the same pattern is now showing up as the fastest month-over-month growth of any product line.',
  aiSummary: "Water Heaters and Fans are the two products drawing the most attention right now — Water Heaters for a fast-growing installation backlog, Fans for a product defect pattern that's showing up in public reviews faster than in internal resolution data. Delivery Delay and Switchgear & MCBs, by contrast, are both improving and don't need attention this week.",
  comparisonBars: [
    { label: 'Water Heaters — Installation', pct: 100, tag: 'Highest', color: '#7C8CF5' },
    { label: 'Fans — Product Defect', pct: 72, tag: 'High', color: '#5D5FC0' },
    { label: 'Delivery Delay', pct: 38, tag: 'Improving', color: '#3FE0B5', tagColor: '#3FE0B5' },
    { label: 'Switchgear & MCBs', pct: 22, tag: 'Improving', color: '#3FE0B5', tagColor: '#3FE0B5' },
  ],
  deepInsight: [
    "The installation issue is concentrated in Delhi NCR, where booking volume has outpaced technician capacity — particularly in the two weeks following promotional sales spikes. This isn't a one-off: the same capacity gap is what's pushing Water Heaters to the top of the growth list too, since demand and complaints are really the same underlying story viewed two ways.",
    'Delivery-related complaints are easing across every region since the logistics SLA fix in April, so that pressure has genuinely come down. Product Defect complaints are holding steady in volume, but a closer look shows they trace almost entirely to a single manufacturing batch rather than a broad, ongoing quality problem.',
    'Looking at where these complaints surface: Call Center is the dominant channel for Water Heater installation issues, which suggests customers are trying to resolve this directly before it shows up publicly — a narrower window than usual to catch it before it becomes a review or social post. CRM/Store and Marketplace Reviews follow, in that order.',
    'By lifecycle stage, the Usage stage accounts for the largest share of these complaints, with Complaint/Resolution itself the second-largest — meaning most of the friction is happening after installation is technically complete, not during the install visit itself. That points toward follow-up quality and post-install support as much as the initial technician visit.',
  ],
  rootCause: "Two separate causes are behind today's picture, and they call for different fixes. First, technician scheduling hasn't scaled with the recent surge in water heater bookings — that's a capacity problem, not a quality one, and it resolves with staffing, not a product fix. Second, a confirmed batch-level manufacturing defect is producing heating-element failures that show up identically across three cities within the same purchase window — that geographic spread is what rules out installation or usage variance and points squarely at the product itself.",
  recommendations: [
    'Add technician capacity to the installation queue in Delhi NCR for two weeks following any promotional sales spike — this is when the scheduling gap consistently opens up.',
    'Escalate the manufacturing defect to the Product Quality team as a containment case, not a service-fix case — the remaining gap is upstream of service.',
    'Flag the Fans product-defect pattern to Quality directly — public ratings are catching this issue before internal resolution data does.',
    'Keep current logistics SLA monitoring in place for Delivery Delay — it\u2019s working, no new action needed there.',
    'No action needed on Switchgear & MCBs this week — volumes are stable to improving across the board.',
  ],
  askAIPrompt: 'Which technicians have the lowest installation backlog in Delhi NCR right now, and how should we reassign work?',
}

export default function PainPointsPane({ onNext, onAskAI }) {
  const { filters } = useDashboardFilters()
  const [d, setD] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setD(null)
    setError(null)
    fetchPainPointsAi(filters)
      .then((data) => {
        if (cancelled) return
        const detail = painPointsDetailFromApi(data)
        if (!detail) throw new Error('Pain Points AI response was empty')
        setD(detail)
      })
      .catch((err) => {
        console.error('Failed to load live Pain Points detail, falling back to mock:', err.message)
        if (cancelled) return
        setError(err.message)
        setD(MOCK)
      })
    return () => { cancelled = true }
  }, [filters.product_category, filters.region])

  if (!d) {
    return (
      <div className="bg-panel border border-line rounded-panel p-[26px] text-center">
        <span className="font-mono text-[11px] text-inkfaint">Loading Pain Points detail…</span>
      </div>
    )
  }

  return (
    <div>
      <Plaque color="#7C8CF5" headline={d.plaqueHeadline} />
      <div className="bg-panel border border-line border-t-0 rounded-b-panel p-[26px]">

        {error && (
          <div className="mb-4 font-mono text-[10px] font-medium text-copper">LIVE DATA UNAVAILABLE · SHOWING MOCK CONTENT</div>
        )}

        <ReportSection kind="ai" title="AI Summary">
          <ReportText>{d.aiSummary}</ReportText>
          {d.comparisonBars.length > 0 && (
            <div className="mt-4">
              {d.comparisonBars.map((row) => (
                <CompareRow
                  key={row.label}
                  label={row.label}
                  pct={row.pct}
                  color={row.color}
                  tag={row.tag}
                  tagColor={row.tagColor}
                />
              ))}
            </div>
          )}
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