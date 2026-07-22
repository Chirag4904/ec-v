import { useEffect, useState } from 'react'

const GENIE_EMBED_URL = 'https://adb-1476038197370632.12.azuredatabricks.net/embed/genie/rooms/01f181a4a09619b2830ffcb836107dda?o=1476038197370632'

export default function Genie({ prefillQuestion }) {
  const [suggested, setSuggested] = useState('')

  useEffect(() => {
    if (prefillQuestion) setSuggested(prefillQuestion)
  }, [prefillQuestion])

  return (
    <section className="view-enter max-w-[1280px] mx-auto px-[30px] pb-[70px]">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center gap-2.5 mb-[18px] pb-3.5 border-b border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-teal" style={{ animation: 'led-pulse 2.2s ease-in-out infinite' }} />
          <b className="font-sans text-ink">GENIE CHAT</b>
          <span className="font-sans text-inksoft text-sm">STRUCTURED Q&amp;A · SQL / GENIE SPACE · CONSUMER INTELLIGENCE</span>
          <span
            className="ml-auto flex items-center gap-1.5 font-mono text-[9.5px] font-semibold tracking-[.3px] text-teal bg-teal/10 border border-teal/30 px-2.5 py-1.5 rounded-full"
            title="Multi-step reasoning across sources, not single-turn lookup — backend setting, confirm with dev team"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[11px] h-[11px]"><path d="M13 2 3 14h7v8l10-12h-7z" /></svg>
            AGENT MODE
          </span>
        </div>

        {suggested && (
          <div className="flex items-center gap-2.5 mb-3 bg-teal/10 border border-teal/30 rounded-lg px-4 py-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-teal flex-shrink-0">Try asking</span>
            <span className="text-[13px] text-ink">{suggested}</span>
          </div>
        )}

        <div className="rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,.4)]" style={{ background: '#fff', padding: 14 }}>
          <iframe
            src={GENIE_EMBED_URL}
            width="100%"
            height="820"
            frameBorder="0"
            allow="clipboard-write"
            title="Databricks Genie Room"
            style={{ display: 'block', borderRadius: 8 }}
          />
        </div>
      </div>
    </section>
  )
}