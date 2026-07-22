const ITEMS = [
  { key: 'overview', label: 'Overview', icon: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></> },
  { key: 'deep', label: 'Deep', icon: <path d="M4 19V10M11 19V5M18 19v-7" /> },
  { key: 'forecast', label: 'Forecast', icon: <><path d="M3 17 L9 10 L13 14 L21 5" /><path d="M15 5 L21 5 L21 11" /></> },
  { key: 'genie', label: 'Genie', icon: <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" /> },
  // { key: 'research', label: 'Research', icon: <><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M7.6 7.2 L11 16.2 M16.4 7.2 L13 16.2 M8.2 6 L15.8 6" /></> },
]

export default function Rail({ activeView, onSetView }) {
  return (
    <nav className="w-[78px] flex-shrink-0 bg-panel border-r border-line flex flex-col items-center py-[22px] gap-1.5">
      {ITEMS.map((item) => {
        const active = activeView === item.key
        return (
          <div
            key={item.key}
            onClick={() => onSetView(item.key)}
            className={`w-[58px] pt-3 pb-2.5 rounded-[9px] flex flex-col items-center gap-1.5 cursor-pointer border ${
              active ? 'bg-panel3 border-linebright text-ink' : 'border-transparent text-inkfaint hover:text-inksoft'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">{item.icon}</svg>
            <span className="font-mono text-[8.6px] font-semibold tracking-[.4px] uppercase text-center">{item.label}</span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: active ? '#E1793B' : 'transparent', boxShadow: active ? '0 0 5px rgba(225,121,59,.45)' : 'none' }}
            />
          </div>
        )
      })}
      <div className="flex-1" />
      <div className="font-mono text-[8px] font-medium text-inkfaint text-center px-1.5 leading-[1.4] tracking-[.3px]">CIF<br/>v2 · MAY 26</div>
    </nav>
  )
}
