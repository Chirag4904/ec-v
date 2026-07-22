import { SIGNAL_GROUPS } from '../data/dashboardData.js'

const sevColor = { hi: 'text-red', med: 'text-copper', low: 'text-amber' }
const groupColor = { copper: 'text-copper', teal: 'text-teal' }

export default function SignalLog() {
  const total = SIGNAL_GROUPS.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div className="mt-7 bg-[#080B09] border border-line rounded-panel overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-[11px] border-b border-line bg-panel">
        <div className="flex gap-[5px]">
          <span className="w-[7px] h-[7px] rounded-full bg-linebright" />
          <span className="w-[7px] h-[7px] rounded-full bg-linebright" />
          <span className="w-[7px] h-[7px] rounded-full bg-linebright" />
        </div>
        <span className="font-mono text-[10.5px] font-semibold tracking-wide uppercase text-inksoft">Signal Log — Early Warning Feed</span>
        <span className="ml-auto font-mono text-[10px] font-semibold text-copper bg-coppersoft px-2 py-1 rounded">{total} ACTIVE</span>
      </div>
      <div className="px-[18px] pt-3.5 pb-[18px] font-mono text-[12.5px] leading-[2] text-inksoft">
        {SIGNAL_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
            <div className="text-inkfaint font-semibold tracking-wide">
              # <span className={groupColor[group.color]}>{group.label}</span> — {group.sub}
            </div>
            {group.items.map((row, i) => (
              <div key={i}>
                <span className="text-inkfaint">{row.ts}</span> <span className={sevColor[row.sev]}>●</span> {row.text} → <span className="text-teal">{row.action}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="text-inkfaint">root@drishti:~$ <span className="text-teal caret">▊</span></div>
      </div>
    </div>
  )
}
