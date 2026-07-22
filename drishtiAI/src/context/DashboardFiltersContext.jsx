import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const DashboardFiltersContext = createContext(null)

const ALLOWED_PRODUCT_CATEGORIES = ['ALL', 'AIR CONDITIONERS']
const ALLOWED_REGIONS = ['ALL', 'NORTH']

function normalize(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback
}

function readInitialFilters() {
  if (typeof window === 'undefined') {
    return { product_category: 'ALL', region: 'ALL' }
  }

  const params = new URLSearchParams(window.location.search)
  const product_category = normalize(params.get('product_category') || 'ALL', ALLOWED_PRODUCT_CATEGORIES, 'ALL')
  const region = normalize(params.get('region') || 'ALL', ALLOWED_REGIONS, 'ALL')
  return { product_category, region }
}

function writeFiltersToUrl(filters) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  params.set('product_category', filters.product_category)
  params.set('region', filters.region)
  const next = `${window.location.pathname}?${params.toString()}${window.location.hash || ''}`
  window.history.replaceState({}, '', next)
}

export function DashboardFiltersProvider({ children }) {
  const [filters, _setFilters] = useState(() => readInitialFilters())

  const setFilters = (updater) => {
    _setFilters((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return {
        product_category: normalize(next?.product_category || 'ALL', ALLOWED_PRODUCT_CATEGORIES, 'ALL'),
        region: normalize(next?.region || 'ALL', ALLOWED_REGIONS, 'ALL'),
      }
    })
  }

  useEffect(() => {
    writeFiltersToUrl(filters)
  }, [filters.product_category, filters.region])

  const value = useMemo(() => ({ filters, setFilters }), [filters])

  return <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFiltersContext)
  if (!ctx) throw new Error('useDashboardFilters must be used within DashboardFiltersProvider')
  return ctx
}