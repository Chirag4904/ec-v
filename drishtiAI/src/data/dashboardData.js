// ============ 4 North Star KPI gauges ============
export const GAUGES = [
  {
    label: 'Service NPS', value: '71', color: '#3FE0B5',
    delta: '↑ +2 pts QoQ', ctx: '76.6L responses · target 75',
    pct: 71,
  },
  {
    label: 'Avg TAT', value: '18.4', unit: 'hrs', color: '#E1793B',
    delta: '↑ +1.2 hrs above target', ctx: 'target 17.2 · water heaters 26 hrs',
    pct: 61,
  },
  {
    label: 'Ticket Volume', value: '4,821', color: '#3FE0B5',
    delta: '↓ −340 vs last month', ctx: '18 cities · closed, cancelled, work done & SMS-confirmed',
    pct: 40, hint: '(hover for breakdown)',
    breakdown: [
      { label: 'Closed', value: '3,650' },
      { label: 'Open', value: '620' },
      { label: 'Cancelled', value: '551' },
    ],
  },
  {
    label: 'Customer Pain Index', value: '58', color: '#F5B942',
    delta: 'Elevated — monitor closely', ctx: '0–100 composite · updated daily',
    pct: 58,
  },
]

// ============ 4 Pillars (finalized) ============
// Each pillar: narrative-first card, comparison chips with real numbers,
// buckets link into the drill-down modal, actions link to detail page + chat.
export const PILLARS = [
  { id: 'pain-points', eyebrow: 'Pain Points Summary', color: '#7C8CF5' },
  { id: 'customer-voice', eyebrow: 'Customer Voice — Sentiment', color: '#4FB6E8' },
  { id: 'sr-volume', eyebrow: 'SR Volume — Work Orders', color: '#F5B942' },
  { id: 'forecast', eyebrow: 'Forecast — Weather & Volume', color: '#E1793B' },
]

export const PILLAR_CARDS = [
  {
    pillarIndex: 0, color: '#7C8CF5', badge: 'crit', badgeLabel: 'CRITICAL',
    eyebrow: 'Pain Points Summary',
    headline: 'Water Heaters are generating more installation-related complaints than any other product this month, and the gap is widening.',
    why: 'The pattern traces to the same technician capacity gap in Delhi NCR — installation bookings are outpacing available technicians, especially after promotional sales spikes. Delivery-related complaints, by contrast, are easing across the board.',
    buckets: [
      { text: 'Water Heaters > Fans — Installation Issue', drillKey: 'wh-install' },
      { text: 'Delivery Delay — improving region-wide', drillKey: 'east-delivery' },
      { text: 'Product Defect — holding steady', drillKey: 'fans-defect' },
    ],
    askAI: 'Why are Water Heater installation complaints rising faster than other products, and what is the root cause?',
  },
  {
    pillarIndex: 1, color: '#4FB6E8', badge: 'watch', badgeLabel: 'WATCH',
    eyebrow: 'Customer Voice — Sentiment Summary',
    headline: 'Customer sentiment is holding steady nationally, but Delhi NCR is pulling satisfaction down faster than anywhere else this month.',
    why: 'Sentiment and resolution time move together closely — as TAT worsens in a region, both NPS and CSAT follow within days. Delhi NCR\u2019s slower resolution times are why it stands out as the clear outlier this month.',
    buckets: [
      { text: 'Delhi NCR — satisfaction falling faster than any other city', drillKey: 'city-delhi' },
      { text: 'Satisfaction & resolution time — strongest link tracked', drillKey: 'nps-tat' },
      { text: 'Social sentiment — a leading indicator, moves before formal tickets', drillKey: 'city-kolkata' },
    ],
    askAI: 'Why is customer sentiment falling faster in Delhi NCR than elsewhere, and what should we do about it?',
  },
  {
    pillarIndex: 2, color: '#F5B942', badge: 'watch', badgeLabel: 'WATCH',
    eyebrow: 'SR Volume — Work Order Summary',
    headline: 'North region is generating more service work orders than any other region, and the gap is growing week over week.',
    why: 'The increase tracks the pre-monsoon demand shift — cooling and water heater service requests both rise as temperatures climb, giving enough lead time to shift staffing before backlog builds.',
    buckets: [
      { text: 'North > Central > South — work order volume', drillKey: 'service-north-fcst' },
      { text: 'Backlog — trending down overall', drillKey: 'sr-backlog' },
    ],
    askAI: 'What is driving the North region work order spike, and how should we prepare staffing?',
  },
  {
    pillarIndex: 3, color: '#E1793B', badge: 'watch', badgeLabel: 'WATCH',
    eyebrow: 'Forecast — Weather & Volume',
    headline: 'Rising temperatures in Delhi NCR are expected to drive a further increase in water heater installation demand over the coming weeks.',
    why: 'This is the same pattern that preceded the current spike — installation requests followed within days of temperatures climbing last month. The dashed line runs through recent history too, so you can see how closely it has tracked what actually happened before trusting where it points next.',
    buckets: [
      { text: 'Delhi NCR temperature — rising, above seasonal average', drillKey: 'growth-wh' },
      { text: 'Forecast line — has tracked actuals closely so far', drillKey: 'growth-wh' },
    ],
    askAI: 'How reliable is the Delhi NCR weather forecast, and what should we prepare for?',
    hasTrendChart: true,
  },
]

// ============ Priority Areas (auto-ranked, illustrative order) ============
export const PRIORITY_AREAS = [
  { rank: 1, name: 'Water Heaters — Installation Issue', share: '18.4%', badge: 'crit', badgeLabel: 'CRITICAL', pillarIndex: 0 },
  { rank: 2, name: 'All Products — Product Defect / Quality', share: '12.1%', badge: 'crit', badgeLabel: 'CRITICAL', pillarIndex: 0 },
  { rank: 3, name: 'North Region — Call Volume Spike', share: '9.6%', badge: 'watch', badgeLabel: 'WATCH', pillarIndex: 2 },
  { rank: 4, name: 'Switchgear & MCBs — Installation Issue', share: '6.8%', badge: 'watch', badgeLabel: 'WATCH', pillarIndex: 0 },
  { rank: 5, name: 'Fans — Delivery Delay', share: '4.2%', badge: 'stable', badgeLabel: 'STABLE', pillarIndex: 0 },
]

// ============ Recommended Actions (pulled from drill-down recommendations) ============
export const RECOMMENDED_ACTIONS = [
  { text: 'Add installation technicians in Delhi NCR for two weeks after any promotional sales spike.', pillarIndex: 0, drillKey: 'wh-install' },
  { text: 'Escalate to Product Quality — the defect batch is a containment case, not a service issue.', pillarIndex: 0, drillKey: 'rca-manufacturing' },
  { text: 'Rebalance staffing toward North 10\u201314 days ahead of the forecasted call spike.', pillarIndex: 2, drillKey: 'service-north-fcst' },
  { text: 'Treat resolution time as the priority lever \u2014 it\u2019s the common driver behind both volume and satisfaction.', pillarIndex: 1, drillKey: 'nps-tat' },
]

// ============ Signal Log — split by upcoming risk vs already happening ============
export const SIGNAL_GROUPS = [
  {
    label: 'upcoming risk', sub: 'forecasted, not yet happened', color: 'copper',
    items: [
      { ts: '[T+7d]', sev: 'hi', text: 'Air purifier FVR drops sharply if the parts gap persists, resolution time exceeds target', action: 'rush filter kits' },
      { ts: '[Jun 01]', sev: 'med', text: 'Pre-monsoon demand flip: WH tickets falling, cooling tickets rising sharply', action: 'rebalance technicians' },
      { ts: '[Jun 06]', sev: 'med', text: 'Eid demand surge, UP/Bihar \u2014 mixer grinder tickets expected to spike', action: 'pre-stock hubs' },
    ],
  },
  {
    label: 'needs attention now', sub: 'already happening', color: 'teal',
    items: [
      { ts: '[ONGOING]', sev: 'low', text: 'Fan Flipkart rating falling \u2014 service-invisible quality signal', action: 'flag to Quality' },
    ],
  },
]
