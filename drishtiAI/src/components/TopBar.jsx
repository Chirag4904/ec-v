export default function TopBar({ activeFn, onSetFn }) {
  return (
    <header className="bg-[linear-gradient(180deg,#101511,#0D110E)] border-b border-line px-[26px] h-16 flex items-center justify-between sticky top-0 z-[300]">
      <div className="flex items-center gap-3">
        <svg className="w-[34px] h-[34px] flex-shrink-0" viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="15.5" stroke="#3A433C" strokeWidth="1" />
          <circle className="mark-ring" cx="17" cy="17" r="15.5" stroke="url(#g1)" strokeWidth="1.4" strokeDasharray="20 78" />
          <path className="mark-pulse" d="M6 18 L12 18 L14.5 11 L18 26 L20.5 15 L22 18 L28 18" stroke="#E1793B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle className="mark-core" cx="17" cy="17" r="2" fill="#3FE0B5" />
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="34" y2="34">
              <stop stopColor="#E1793B" />
              <stop offset="1" stopColor="#3FE0B5" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col leading-[1.05]">
          <span className="font-display text-[17px] font-semibold tracking-[.3px] text-ink">DRISHTI</span>
          <span className="font-mono text-[9.5px] font-medium tracking-[1.6px] uppercase text-inkfaint mt-[3px]">Signal Panel · Consumer Insight Factory</span>
        </div>
      </div>

      {/*
      <div className="flex items-center gap-[22px]">
        {['Brand', 'Product', 'Service'].map((label) => {
          const active = activeFn === label
          return (
            <div
              key={label}
              onClick={() => onSetFn(label, label === 'Service' ? 'service' : null)}
              className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
            >
              <span className={`font-mono text-[10px] font-semibold tracking-[.8px] uppercase transition-colors ${active ? 'text-ink' : 'text-inkfaint'}`}>
                {label}
              </span>
              <div className="w-10 h-5 rounded-[5px] bg-[#0C100D] border border-linebright relative shadow-[inset_0_1px_3px_rgba(0,0,0,.6)]">
                <div
                  className="absolute top-[2px] w-4 h-3.5 rounded-[3px] border transition-[left] duration-200"
                  style={{
                    left: active ? '22px' : '2px',
                    background: active ? 'linear-gradient(180deg,#F0954F,#E1793B)' : 'linear-gradient(180deg,#3A433C,#252B26)',
                    borderColor: active ? '#F5A162' : 'rgba(255,255,255,.12)',
                    boxShadow: '0 1px 2px rgba(0,0,0,.5)',
                  }}
                />
              </div>
              <span
                className="w-[5px] h-[5px] rounded-full"
                style={{ background: active ? '#E1793B' : 'var(--color-inkfaint)', boxShadow: active ? '0 0 6px rgba(225,121,59,.45)' : 'none' }}
              />
            </div>
          )
        })}
      </div>
      */}

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-medium text-inksoft">
          <svg width="6" height="6" className="text-teal" style={{ animation: 'led-pulse 2.2s ease-in-out infinite' }}>
            <circle cx="3" cy="3" r="3" fill="currentColor" />
          </svg>
          LIVE · SYNCED 6 MIN AGO
        </span>
        {/* <span className="font-sans text-[11px] font-medium text-ink bg-panel3 border border-linebright rounded-md px-3 py-2">Customer Service Manager</span> */}
      </div>
    </header>
  )
}
