export function Plaque({ color, headline }) {
  return (
    <div className="bg-panel border border-line rounded-t-panel px-[26px] py-[22px]" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="font-mono text-[10px] font-semibold tracking-widest uppercase mb-2.5" style={{ color }}>What's happening</div>
      <div className="font-display text-[20px] font-semibold leading-snug text-ink max-w-[760px]">{headline}</div>
    </div>
  )
}

const icons = {
  ai: <path d="M12 2 L14 9 L21 11 L14 13 L12 20 L10 13 L3 11 L10 9 Z" />,
  deep: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  root: <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />,
  rec: <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />,
}
const labelColor = { ai: 'text-teal', deep: 'text-indigo', root: 'text-rose', rec: 'text-copper' }

export function ReportSection({ kind, title, children }) {
  return (
    <div className="mb-[26px]">
      <div className={`flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide mb-2.5 ${labelColor[kind]}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">{icons[kind]}</svg>
        {title}
      </div>
      {children}
    </div>
  )
}

export function ReportText({ children }) {
  return <div className="text-sm leading-[1.75] text-ink max-w-[760px] mb-3">{children}</div>
}

export function RecList({ items }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((text, i) => (
        <div key={i} className="flex gap-3 bg-panel2 border border-line rounded-[10px] px-4 py-3.5">
          <span className="w-[22px] h-[22px] rounded-md bg-coppersoft text-copper font-mono font-bold text-[11px] flex items-center justify-center flex-shrink-0">{i + 1}</span>
          <span className="text-[13px] leading-relaxed text-ink">{text}</span>
        </div>
      ))}
    </div>
  )
}

export function ChatCTA({ text, question, onAskAI }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-panel2 border border-dashed border-linebright rounded-xl px-5 py-4 mt-[26px]">
      <div className="text-[12.5px] text-inksoft max-w-[480px]">
        <b className="text-ink">Want more detail?</b> {text}
      </div>
      <button
        onClick={() => onAskAI(question)}
        className="flex items-center gap-1.5 bg-teal/10 border border-teal/35 text-teal font-sans text-[11.5px] font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap hover:bg-teal/20 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
          <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        </svg>
        Ask AI
      </button>
    </div>
  )
}

export function NextLink({ onClick }) {
  return (
    <div onClick={onClick} className="mt-6 px-[18px] py-3.5 border border-dashed border-linebright rounded-panel cursor-pointer text-center hover:bg-panel2 hover:border-copper transition-colors">
      <span className="font-mono text-[11.5px] font-semibold text-copper tracking-wide">Next → See the 30-day forecast for this area</span>
    </div>
  )
}

export { CompareRow } from '../../components/DrillCharts.jsx'
