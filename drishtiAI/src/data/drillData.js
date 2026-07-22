export const DRILL_PILLAR_LABELS = ['Pain Points Summary', 'Customer Voice — Sentiment', 'SR Volume — Work Orders', 'Forecast — Weather & Volume']

export const DRILL_HERO = {
  'wh-install': {
    title: 'Water Heaters × Installation Issue', color: '#7C8CF5', bias: 1,
    ctx: 'The single largest concentration on the grid — no other product/category pair comes close.',
    why: 'Technician-led installations are being booked faster than technician capacity can absorb — the gap opens up specifically in the two weeks following a promotional sales spike, when order volume jumps but staffing doesn\u2019t.',
    corr: [
      ['Complaint Volume × NPS', '-0.87', 'As this cell rises, overall NPS falls almost in lockstep.'],
      ['Sentiment × TAT', '0.74', 'Negative sentiment on this theme tracks resolution delay closely.'],
    ],
    rec: 'Add technician capacity to the installation queue for two weeks following any promotional sales spike — this is when the scheduling gap consistently opens up.',
    conf: 88,
  },
  'fans-defect': {
    title: 'Fans × Product Defect', color: '#7C8CF5', bias: 1,
    ctx: 'Second-largest concentration on the grid, behind Water Heaters × Installation.',
    why: 'A quality issue in a recent fan motor batch is generating defect complaints faster than it shows up in formal resolution data — public review ratings are catching it before internal metrics do.',
    corr: [
      ['Star Rating Trend', '-0.68', 'Marketplace fan ratings have declined as this cell has grown.'],
      ['Repeat Complaint Rate', '0.59', 'A meaningful share of these are repeat complainants.'],
    ],
    rec: 'Flag to Quality as a service-invisible signal — resolution data alone understates how much this is hurting public perception.',
    conf: 74,
  },
  'east-delivery': {
    title: 'East Region × Delivery Delay', color: '#F5B942', bias: 1,
    ctx: 'A distinct hot spot, separate from the North region pattern — a different driver.',
    why: 'Monsoon-linked logistics disruption reaches this region earlier than others, and it traces to delivery-window performance from one specific third-party logistics partner, not a regional demand spike.',
    corr: [
      ['Monsoon Onset Timing', '0.69', 'East sees monsoon-linked logistics disruption earlier than other regions.'],
      ['Logistics Partner SLA Breach', '0.58', 'Tied to the same third-party logistics partner flagged in Root Cause.'],
    ],
    rec: 'Review logistics partner SLA performance specifically for East region routes ahead of monsoon onset.',
    conf: 70,
  },
  'growth-wh': {
    title: 'Water Heaters — Growth Rate', color: '#E1793B', bias: 1,
    ctx: 'The fastest-growing product line this month, by a clear margin.',
    why: 'Demand for new installs is outpacing technician availability, and the timing tracks tightly with the early heatwave in Delhi NCR — this is a capacity problem showing up as a growth number, not organic demand alone.',
    corr: [
      ['Weather Correlation Coefficient', '0.71', 'Growth tracks the early heatwave closely.'],
      ['Forecast Confidence Interval', '78%', 'Model confidence for the 30-day forward projection.'],
    ],
    rec: 'Pre-position installation technician capacity in Delhi NCR ahead of the next forecasted heatwave — demand has historically risen within 5 days of a heat event being flagged.',
    conf: 78,
  },
  'rca-manufacturing': {
    title: 'Manufacturing / QC Gap', color: '#D9739F', bias: 0,
    ctx: 'The single largest cause behind Product Defect complaints — well ahead of every other cause.',
    why: 'A confirmed batch-level manufacturing defect is producing identical heating-element failures across three cities within the same purchase window — that geographic spread is what confirms it\u2019s a product issue, not installation or usage variance.',
    corr: [
      ['Cross-Channel Cause Confirmation', '0.83', 'Same root cause corroborated across CRM, Locobuzz and Flipkart.'],
      ['Resolution Effectiveness Index', '0.64', 'Post-fix effectiveness for cases where this cause was addressed.'],
    ],
    rec: 'Escalate to the product quality team as a containment case, not a service-fix case — the remaining gap is upstream of service.',
    conf: 91,
  },
  'nps-tat': {
    title: 'NPS × TAT', color: '#4FB6E8', bias: -1,
    ctx: 'The strongest relationship anywhere in the data.',
    why: 'As resolution time increases, customers rate their experience worse almost immediately — TAT is not just correlated with NPS, it\u2019s the most direct lever leadership has for moving NPS at all.',
    corr: [
      ['Lead-Lag (days)', '2\u20133', 'Sentiment shifts 2\u20133 days before formal SR tickets reflect the same issue.'],
      ['Cross-Source Consistency', '0.79', 'CRM, Locobuzz and reviews agree on direction.'],
    ],
    rec: 'Treat TAT as the priority lever, not NPS directly — it is the common driver behind both complaint volume and NPS movement.',
    conf: 87,
  },
  'city-delhi': {
    title: 'Delhi NCR', color: '#E1793B', bias: 1,
    ctx: 'The clear outlier on the chart — worst resolution time and worst satisfaction score of any city, by a wide margin.',
    why: 'This city combines the slowest resolution time with the lowest satisfaction score, and both trace back to the same root cause — the technician capacity shortfall behind the water heater installation surge.',
    corr: [
      ['Complaint Volume × NPS', '-0.87', 'Delhi NCR shows the strongest version of this relationship of any city.'],
      ['Weather-Driven Volume Uplift %', '0.71', 'A large share of this city\u2019s load traces to heatwave-driven demand.'],
    ],
    rec: 'Treat resolution time as the priority lever for Delhi NCR — fixing it should move complaint volume, sentiment and NPS together.',
    conf: 87,
  },
  'city-kolkata': {
    title: 'Kolkata', color: '#F5B942', bias: 1,
    ctx: 'Second-highest TAT on the chart, trending toward the Delhi NCR pattern.',
    why: 'Staffing here hasn\u2019t kept pace with recent demand growth — it\u2019s an earlier-stage version of the same gap that produced Delhi NCR\u2019s outlier position, not a separate issue.',
    corr: [
      ['Capacity Gap (FTE)', '0.58', 'Staffing has not kept pace with recent demand growth here.'],
      ['Complaint Volume × NPS', '-0.61', 'A moderate version of the same TAT-NPS relationship seen in Delhi.'],
    ],
    rec: 'Monitor closely — a modest staffing addition now could prevent this city from following Delhi NCR\u2019s trajectory.',
    conf: 63,
  },
  'service-north-fcst': {
    title: 'North Region — 30-Day Forecast', color: '#F5B942', bias: 1,
    ctx: 'The largest projected call-volume spike of any region over the next 30 days.',
    why: 'A monsoon-linked demand shift is layering on top of technician capacity that\u2019s already tight from the ongoing installation surge — the forecast compounds an existing gap rather than creating a new one.',
    corr: [
      ['Weather-Driven Volume Uplift %', '0.71', '28% of this specific spike is attributed to monsoon-linked demand.'],
      ['Capacity Gap (FTE)', '0.66', 'Current staffing plan does not yet account for this forecasted spike.'],
    ],
    rec: 'Rebalance technician and call-center staffing toward North region 10\u201314 days ahead of the forecasted spike — the weather signal gives enough lead time to shift capacity before backlog builds.',
    conf: 81,
  },
}

function seed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}
function srand(n) {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

const GENERIC_CORR_BY_PILLAR = [
  [['Complaint Volume × NPS', '-0.6'], ['Channel Mix Consistency', '0.5']],
  [['Cross-Source Consistency', '0.6'], ['Lead-Lag (days)', '2']],
  [['Weather-Driven Volume Uplift %', '0.5'], ['Capacity Gap (FTE)', '0.5']],
  [['Weather Correlation Coefficient', '0.5'], ['Forecast Confidence', '0.7']],
]

export function getDrillContent(pillarIndex, key) {
  const hero = DRILL_HERO[key]
  if (hero) return hero

  const sd = seed(key)
  const label = key.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' × ')
  return {
    title: label,
    color: PILLAR_COLOR[pillarIndex] ?? '#7C8CF5',
    bias: srand(sd) > 0.5 ? 1 : 0,
    ctx: 'This period.',
    why: 'No confirmed single driver at this granular level yet — this pattern typically traces back to the same root causes flagged elsewhere in this section (technician capacity, weather timing, or a specific batch or partner issue).',
    corr: GENERIC_CORR_BY_PILLAR[pillarIndex].map((p) => [p[0], p[1], 'Estimated relationship based on this pillar\u2019s typical drivers — not yet confirmed at this granular level.']),
    rec: 'No confirmed single driver at this granularity yet — monitor alongside the hero items in this section for now.',
    conf: 40 + Math.round(srand(sd + 1) * 20),
  }
}

const PILLAR_COLOR = ['#7C8CF5', '#4FB6E8', '#F5B942', '#E1793B']

export { seed, srand }
