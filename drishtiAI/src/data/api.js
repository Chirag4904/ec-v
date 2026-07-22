const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

async function getJson(path, { timeoutMs = 90_000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      // Forces a real network round-trip every time — without this, the
      // browser can serve a cached 304 (no body) for a plain GET, which
      // either throws confusingly or hangs depending on the browser.
      cache: 'no-store',
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${timeoutMs / 1000}s — is the backend running?`)
    }
    throw new Error(`Could not reach backend at ${path}: ${err.message}`)
  } finally {
    clearTimeout(timer)
  }

  const body = await res.json().catch(() => null)

  if (!res.ok || !body?.success) {
    throw new Error(body?.error || `Request to ${path} failed (${res.status})`)
  }

  return body.data
}

export function fetchTopKpis() {
  return getJson('/api/dashboard/top-kpis') // shape produced by mapTopKpis() on the backend
}

export function fetchPriorityAreas() {
  return getJson('/api/dashboard/priority-areas') // raw Databricks rows — shaped client-side, see priorityAreasAdapter.js
}

export function fetchPainPointsAi() {
  return getJson('/api/dashboard/pain-points-ai') // single-row AI-generated pillar payload — see painPointsAdapter.js
}

export function fetchSentimentAi() {
  return getJson('/api/dashboard/sentiment-ai') // single-row AI-generated pillar payload — see sentimentAdapter.js
}

export function fetchSrVolumeAi() {
  return getJson('/api/dashboard/sr-volume-ai') // single-row AI-generated pillar payload — see srVolumeAdapter.js
}

export function fetchForecastAi() {
  return getJson('/api/dashboard/forecast-ai') // single-row AI-generated pillar payload — see forecastAdapter.js
}

export function fetchEarlyWarningFeed() {
  return getJson('/api/dashboard/early-warning-feed') // live rows for SignalLog.jsx
}

// Generic per-item drill-down detail — same shape regardless of which
// pillar the highlight belongs to (card_key distinguishes them). Called
// with the full detailApiPath a bucket/chip already carries, e.g.
// "/api/dashboard/ai-highlights/forecast_8eafec7dd6c2435ba5fc6dc6".
export function fetchHighlightDetail(path) {
  return getJson(path)
}