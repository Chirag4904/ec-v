// Turns an array of numeric values into an SVG path string, scaled to fit
// the given pixel width/height. valueRange lets multiple series (e.g.
// actual + forecast bounds) share the same vertical scale so they line up.
export function seriesToPath(values, { width, height, padTop = 6, padBottom = 6, valueRange, startX = 0 }) {
  if (!values.length) return ''
  const [min, max] = valueRange ?? [Math.min(...values), Math.max(...values)]
  const usableH = height - padTop - padBottom
  const stepX = values.length > 1 ? width / (values.length - 1) : 0

  const points = values.map((v, i) => {
    const x = startX + i * stepX
    const frac = max === min ? 0.5 : (v - min) / (max - min)
    const y = padTop + (1 - frac) * usableH
    return { x, y }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return { path, points }
}

// Confidence-band area path (lower bound forward, upper bound backward)
export function bandToPath(lowerValues, upperValues, opts) {
  const { points: lowerPts } = seriesToPath(lowerValues, opts)
  const { points: upperPts } = seriesToPath(upperValues, opts)
  const forward = lowerPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const backward = [...upperPts].reverse().map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `${forward} ${backward} Z`
}