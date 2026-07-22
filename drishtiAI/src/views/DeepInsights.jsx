import { PILLARS } from '../data/dashboardData.js'
import PainPointsPane from './panes/PainPointsPane.jsx'
import CustomerVoicePane from './panes/CustomerVoicePane.jsx'
import SrVolumePane from './panes/SrVolumePane.jsx'

const PANES = [PainPointsPane, CustomerVoicePane, SrVolumePane]

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-[11px] h-[11px] ml-1 opacity-70">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export default function DeepInsights({ selectedPillar, onSelectPillar, onGoForecast, onAskAI }) {
  const Pane = PANES[selectedPillar] ?? PANES[0]

  return (
    <section className="view-enter max-w-[1280px] mx-auto px-[30px] pb-[70px]">
      <div className="flex gap-1.5 flex-wrap mb-5">
        {PILLARS.slice(0, 3).map((pillar, i) => {
          const active = selectedPillar === i
          return (
            <div
              key={pillar.id}
              onClick={() => onSelectPillar(i)}
              className={`font-mono text-[10.5px] font-semibold tracking-wide px-3.5 py-2.5 rounded-md border cursor-pointer flex items-center gap-2 ${
                active ? 'bg-panel3 text-ink border-linebright' : 'bg-panel text-inkfaint border-line'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-[1px]" style={{ background: pillar.color }} />
              {pillar.eyebrow}
            </div>
          )
        })}
        <div
          onClick={onGoForecast}
          className="font-mono text-[10.5px] font-semibold tracking-wide px-3.5 py-2.5 rounded-md border cursor-pointer flex items-center gap-2 bg-panel text-inkfaint border-line"
        >
          <span className="w-1.5 h-1.5 rounded-[1px]" style={{ background: '#E1793B' }} />
          Forecast — Weather &amp; Volume
          <ArrowIcon />
        </div>
      </div>

      <Pane onNext={onGoForecast} onAskAI={onAskAI} />
    </section>
  )
}
