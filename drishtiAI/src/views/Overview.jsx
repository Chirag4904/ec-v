import { useEffect, useState } from 'react'
import InstrumentCluster from '../components/InstrumentCluster.jsx'
import PillarCard from '../components/PillarCard.jsx'
import PriorityAreas from '../components/PriorityAreas.jsx'
import RecommendedActions from '../components/RecommendedActions.jsx'
import SignalLog from '../components/SignalLog.jsx'
import { PILLARS, PILLAR_CARDS } from '../data/dashboardData.js'
import { fetchPainPointsAi, fetchSentimentAi, fetchSrVolumeAi, fetchForecastAi } from '../data/api.js'
import { pillarCardFromApi as painPointsCardFromApi } from '../data/painPointsAdapter.js'
import { pillarCardFromApi as sentimentCardFromApi } from '../data/sentimentAdapter.js'
import { pillarCardFromApi as srVolumeCardFromApi } from '../data/srVolumeAdapter.js'
import { pillarCardFromApi as forecastCardFromApi } from '../data/forecastAdapter.js'

export default function Overview({ onOpenDrill, onGoDeep, onAskAI }) {
  const [cards, setCards] = useState(() => Array(PILLAR_CARDS.length).fill(null))

  useEffect(() => {
    let cancelled = false

    // Sequential, not Promise.all/parallel — if 4 simultaneous queries were
    // overwhelming the Databricks SQL warehouse (a real possibility on a
    // small/serverless warehouse), running them one after another avoids
    // that entirely. Each pillar still updates independently as soon as
    // its own fetch resolves, so this doesn't make the page feel slower
    // than necessary.
    const updateCard = (index, nextCard) => {
      setCards((prev) => prev.map((card, i) => (i === index ? nextCard : card)))
    }

    async function loadCard(index, fetcher, adapter, label) {
      try {
        const data = await fetcher()
        if (cancelled) return
        const liveCard = adapter(data)
        if (!liveCard) throw new Error('Adapter returned no card')
        updateCard(index, liveCard)
      } catch (err) {
        if (cancelled) return
        console.error(`Failed to load live ${label} card, showing mock:`, err.message)
        updateCard(index, PILLAR_CARDS[index])
      }
    }

    async function loadAll() {
      await loadCard(0, fetchPainPointsAi, painPointsCardFromApi, 'Pain Points')
      await loadCard(1, fetchSentimentAi, sentimentCardFromApi, 'Customer Voice')
      await loadCard(2, fetchSrVolumeAi, srVolumeCardFromApi, 'SR Volume')
      await loadCard(3, fetchForecastAi, forecastCardFromApi, 'Forecast')
    }

    loadAll()
    return () => { cancelled = true }
  }, [])

  return (
    <section className="view-enter max-w-[1280px] mx-auto px-[30px] pb-[70px]">
      <div className="flex justify-between items-end mb-5">
        <div>
          <div className="font-display text-[22px] font-semibold text-ink">Good morning, Niya.</div>
          <div className="font-mono text-[11px] text-inkfaint mt-1.5 tracking-wide">
            CUSTOMER SERVICE INTELLIGENCE · <b className="text-copper">2 of 4 pillars need attention today</b>
          </div>
        </div>
      </div>

      <InstrumentCluster />

      <div className="h-[26px] relative mx-6">
        <svg viewBox="0 0 1220 26" preserveAspectRatio="none" className="w-full h-full">
          <line x1="0" y1="13" x2="1220" y2="13" stroke="#232A25" strokeWidth="1" />
          <circle cx="150" cy="13" r="2.4" fill="#3A433C" />
          <circle cx="460" cy="13" r="2.4" fill="#3A433C" />
          <circle cx="770" cy="13" r="2.4" fill="#3A433C" />
          <circle cx="1070" cy="13" r="2.4" fill="#3A433C" />
        </svg>
      </div>

      <div className="flex items-baseline justify-between mt-[26px] mb-2.5 px-0.5">
        <h2 className="font-mono text-[10px] font-semibold tracking-widest uppercase text-inkfaint">What Needs Your Attention</h2>
        <span className="font-mono text-[10.5px] text-inkfaint">AI-generated summary per pillar · click through for detail or to ask Drishti</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {cards.map((card, index) => (
          card ? (
            <PillarCard key={card.pillarIndex} card={card} onOpenDrill={onOpenDrill} onGoDeep={onGoDeep} onAskAI={onAskAI} />
          ) : (
            <div
              key={PILLARS[index].id}
              className="bg-panel border border-line rounded-xl shadow-card p-5 animate-pulse"
              style={{ borderLeft: `3px solid ${PILLARS[index].color}` }}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wide" style={{ color: PILLARS[index].color }}>
                  {PILLARS[index].eyebrow}
                </span>
                <span className="ml-auto h-6 w-20 rounded-full bg-panel3 border border-line" />
              </div>
              <div className="font-mono text-[9.5px] font-semibold uppercase tracking-wide text-teal mb-2">Loading AI Summary</div>
              <div className="h-5 w-3/4 rounded bg-panel3 mb-2" />
              <div className="h-4 w-full rounded bg-panel3 mb-1.5" />
              <div className="h-4 w-5/6 rounded bg-panel3 mb-3.5" />
              <div className="flex gap-2.5 flex-wrap items-center mb-4">
                <span className="h-8 w-44 rounded-md bg-panel3 border border-line" />
                <span className="h-8 w-36 rounded-md bg-panel3 border border-line" />
              </div>
              <div className="font-mono text-[11px] text-inkfaint">Loading live pillar data…</div>
            </div>
          )
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mt-[26px]">
        <PriorityAreas onGoDeep={onGoDeep} />
        <RecommendedActions onOpenDrill={onOpenDrill} />
      </div>

      <SignalLog />
    </section>
  )
}