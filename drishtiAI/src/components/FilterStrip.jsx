function FSel({ options }) {
  return (
    <div className="relative flex items-center after:content-[''] after:absolute after:right-[10px] after:w-1.5 after:h-1.5 after:border-r-[1.4px] after:border-b-[1.4px] after:border-inkfaint after:rotate-45 after:pointer-events-none">
      <select className="appearance-none font-mono text-[11px] font-medium text-inksoft bg-panel3 border border-linebright rounded-md py-2 pl-[11px] pr-[26px] cursor-pointer outline-none hover:border-copper">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function FilterStrip() {
  return (
    <div className="max-w-[1280px] mx-auto px-[30px] pt-[22px]">
      <div className="flex items-center gap-2 mb-[22px] px-3.5 py-2.5 bg-panel border border-line rounded-lg">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[.6px] text-inkfaint mr-0.5">Filter</span>
        <FSel options={['All categories', 'Water Heaters', 'Fans', 'Cables & Wires', 'Air Purifiers']} />
        <div className="w-px h-[18px] bg-line mx-0.5" />
        <FSel options={['May 2026', 'Apr 2026', 'Q1 FY26–27', 'Trailing 12mo']} />
        <div className="w-px h-[18px] bg-line mx-0.5" />
        <FSel options={['All regions', 'North', 'South', 'East', 'West']} />
        <span className="ml-auto font-mono text-[10px] font-medium text-inkfaint">Applies across Overview · Deep · Forecast · Genie · Research</span>
      </div>
    </div>
  )
}
