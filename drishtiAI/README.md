# Drishti Signal Panel — React + Tailwind v4

## Setup
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to /dist
```

## Tailwind v4 — how theming works here
This project uses Tailwind **v4**, which has no `tailwind.config.js` and no
PostCSS pipeline. Everything is CSS-first:

- `src/index.css` starts with `@import "tailwindcss";`
- Right below it, an `@theme { ... }` block defines the design tokens
  (colors, fonts, radius) as CSS custom properties. Tailwind v4 auto-generates
  real utility classes from these — `--color-copper` gives you `bg-copper`,
  `text-copper`, `border-copper`, etc. `--font-display` gives you `font-display`.
- `vite.config.js` registers the `@tailwindcss/vite` plugin — that's the only
  build wiring needed, no `postcss.config.js`.

If you ever see `Cannot apply unknown utility class` again, it almost always
means a CSS file is using `@apply` without `@import "tailwindcss"` (or the
`@theme` block defining that token) present in the same file / build context.

## Structure
```
src/
  components/     TopBar, Rail, FilterStrip, InstrumentCluster, Gauge,
                  BreakerPanel, BreakerMiniChart, SignalLog
  views/          Overview, DeepInsights, Genie, Research
  data/kpis.js    single source of truth for the 6 KPI tiles, accordions,
                  and Deep Insights chips — edit here to change copy/values
  index.css       @theme tokens + Tailwind import + bespoke keyframe
                  animations (logo pulse, gauge draw-in) utilities can't express
```

## Notes
- Only the **Service** function panel is wired up (Brand/Product toggles are
  visual-only, matching the current design stage).
- Only KPI 02 (Complaint Growth) has a fully built Deep Insights page — the
  other five chips route there too; extending each is now just a matter of
  adding a case per KPI id, same pattern as `BreakerMiniChart.jsx`.
- All interactivity (rail nav, rockers, lever/tile clicks, accordions, pillar
  chips) is plain React state in `App.jsx` — no external state library.
- Gauge arc math (SVG path + rotation degrees) is precomputed in `data/kpis.js`.
