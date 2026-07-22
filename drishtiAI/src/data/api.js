const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function withDashboardFilters(path, filters) {
  if (!filters) return path

  const params = new URLSearchParams()
  if (filters.product_category) params.set('product_category', filters.product_category)
  if (filters.region) params.set('region', filters.region)

  const qs = params.toString()
  if (!qs) return path
  return `${path}?${qs}`
}

async function getJson(path, { timeoutMs = 90_000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
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

export function fetchTopKpis(filters) {
  return getJson(withDashboardFilters('/api/dashboard/top-kpis', filters))
}

export function fetchPriorityAreas(filters) {
  return getJson(withDashboardFilters('/api/dashboard/priority-areas', filters))
}

export function fetchPainPointsAi(filters) {
  return getJson(withDashboardFilters('/api/dashboard/pain-points-ai', filters))
}

export function fetchSentimentAi(filters) {
  return getJson(withDashboardFilters('/api/dashboard/sentiment-ai', filters))
}

export function fetchSrVolumeAi(filters) {
  return getJson(withDashboardFilters('/api/dashboard/sr-volume-ai', filters))
}

export function fetchForecastAi(filters) {
  return getJson(withDashboardFilters('/api/dashboard/forecast-ai', filters))
}

export function fetchEarlyWarningFeed(filters) {
  return getJson(withDashboardFilters('/api/dashboard/early-warning-feed', filters))
}

export function fetchRecommendedActions(filters) {
  return getJson(withDashboardFilters('/api/dashboard/recommended-actions', filters))
}

export function fetchHighlightDetail(path) {
  return getJson(path)
}