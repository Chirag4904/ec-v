import { RECOMMENDED_ACTIONS } from '../data/dashboardData.js'

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3 h-3">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

export default function RecommendedActions({ onOpenDrill }) {
  return (
    <div className="bg-panel border border-line rounded-xl shadow-card px-5 py-[18px]">
      <div className="flex justify-between items-baseline mb-2.5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink">Recommended Actions</h3>
        <span className="font-mono text-[10px] text-inkfaint">PULLED FROM THIS WEEK'S AI ANALYSIS</span>
      </div>
      {RECOMMENDED_ACTIONS.map((item, i) => (
        <div
          key={i}
          onClick={() => onOpenDrill(item.pillarIndex, item.drillKey)}
          className={`flex items-start gap-[11px] py-[11px] cursor-pointer group ${i > 0 ? 'border-t border-line' : ''}`}
        >
          <div className="w-[22px] h-[22px] rounded-md bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-teal">
            <CheckIcon />
          </div>
          <div className="font-sans text-xs leading-relaxed text-inksoft group-hover:text-ink transition-colors">{item.text}</div>
        </div>
      ))}
    </div>
  )
}
