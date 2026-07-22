const STEPS = ['Consumer Insights Agent', 'Product Quality Agent', 'Competitive Intel Agent', 'Synthesis']

export default function Research() {
  return (
    <section className="view-enter max-w-[1280px] mx-auto px-[30px] pb-[70px]">
      <div className="max-w-[820px] mx-auto">

        <div className="flex items-center gap-2.5 mb-[18px] pb-3.5 border-b border-line">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4FB6E8', animation: 'led-pulse 2.2s ease-in-out infinite', color: '#4FB6E8' }} />
          <b className="font-sans text-ink">RESEARCH AGENT</b>
          <span className="font-sans text-inksoft text-sm">MULTI-AGENT SUPERVISOR · CROSS-SPACE SYNTHESIS</span>
        </div>

        <div className="flex gap-3 text-[12.5px] leading-[1.6]">
          <span className="font-mono text-[10px] text-inkfaint w-[52px] flex-shrink-0 pt-0.5">10:14</span>
          <span className="font-mono text-[10.5px] font-semibold text-inksoft w-[78px] flex-shrink-0 pt-0.5 tracking-[.3px]">NIYA</span>
          <div className="text-ink flex-1">Why is Delhi NCR underperforming on service metrics, and what should we do about it?</div>
        </div>

        <div className="flex items-start gap-0 my-5 mb-[26px]">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2 flex-1 relative">
              {i < STEPS.length - 1 && <div className="absolute top-4 left-1/2 w-full h-[1.5px] bg-teal opacity-40 z-[1]" />}
              <div className="w-8 h-8 rounded-full bg-teal text-[#04120D] font-bold border-[1.5px] border-teal flex items-center justify-center text-[13px] z-[2]">✓</div>
              <span className="font-mono text-[9.5px] font-semibold text-inksoft text-center max-w-[110px]">{label}</span>
            </div>
          ))}
        </div>

        <div className="mb-[18px]">
          <div className="font-mono text-[10.5px] font-semibold tracking-[.6px] uppercase text-inkfaint mb-2">Findings</div>
          <div className="text-[13px] leading-[1.7] text-ink">
            Delhi NCR shows a compounding pattern across three independent data sources: most of this month's SLA-breaching water heater tickets trace to one manufacturing batch, Locobuzz shows a sharp spike in Delhi-specific share of voice on service complaints, and Flipkart reviews in the region echo the same "complaint raised, still waiting" language found in the ticketing data.
          </div>
        </div>
        <div className="mb-[18px]">
          <div className="font-mono text-[10.5px] font-semibold tracking-[.6px] uppercase text-inkfaint mb-2">Root Cause</div>
          <div className="text-[13px] leading-[1.7] text-ink">
            The Product Quality Agent confirms the affected manufacturing batch as the upstream cause. The Consumer Insights Agent independently confirms the same geography and timeframe from unstructured review data — this is not a service-capacity problem, it's a parts and batch-containment problem being experienced as a service problem.
          </div>
        </div>

        <div className="my-[18px]">
          <svg viewBox="0 0 760 130" className="w-full h-[130px]">
            <line x1="0" y1="20" x2="760" y2="20" stroke="#1B211C" /><line x1="0" y1="65" x2="760" y2="65" stroke="#1B211C" /><line x1="0" y1="110" x2="760" y2="110" stroke="#1B211C" />
            <path d="M0,95 80,88 160,80 240,70 320,55 400,42 480,60 560,50 640,38 720,26 760,20" fill="none" stroke="#4FB6E8" strokeWidth="2.2" strokeLinecap="round" />
            <text x="8" y="14" fontFamily="IBM Plex Mono" fontSize="9.5" fill="#57625B">DELHI NCR SHARE OF VOICE — SERVICE COMPLAINTS, 90 DAYS</text>
          </svg>
        </div>

        <div className="bg-tealsoft border border-teal/[.28] rounded-panel px-5 py-[18px] mt-[22px]">
          <div className="flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-teal mb-2.5">✦ Recommendation</div>
          <div className="text-[13px] leading-[1.65] text-ink">
            Treat this as a batch-containment escalation, not a staffing issue: proactively replace the affected units and auto-escalate any Delhi NCR water-heater ticket past 20 hours. Do not add technician headcount to the region — the underlying driver is parts, not capacity.
          </div>
          <div className="flex justify-between items-center mt-[15px]">
            <div className="flex gap-1.5">
              <button className="w-7 h-7 rounded-md border border-teal/30 bg-panel text-xs">👍</button>
              <button className="w-7 h-7 rounded-md border border-teal/30 bg-panel text-xs">👎</button>
            </div>
            <span className="font-mono text-[9.5px] text-inkfaint">3 AGENTS · 6 SOURCES · SYNTHESIZED IN 4.2s</span>
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap mt-4">
          {['CRM — service ticketing', 'SAP — quality & batch records', 'Locobuzz — share of voice', 'Flipkart — review NLP', 'Work Order — category × region', 'IMD — seasonal context'].map((s) => (
            <span key={s} className="font-mono text-[10px] px-[11px] py-[7px] rounded-md border border-linebright bg-panel3 text-inksoft">◆ {s}</span>
          ))}
        </div>

        <div className="flex items-center gap-2.5 bg-[#080B09] border border-linebright rounded-lg px-4 py-3.5 mt-5">
          <span className="font-mono text-[13px] font-semibold text-sky">&gt;</span>
          <input
            type="text"
            placeholder="Ask Drishti a research question that spans multiple sources…"
            className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-ink placeholder:text-inkfaint"
          />
          <span className="w-[7px] h-[15px] bg-sky" style={{ animation: 'caret 1s steps(1) infinite' }} />
        </div>

      </div>
    </section>
  )
}