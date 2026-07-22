import { createContext, useCallback, useContext, useRef, useState } from 'react'

const TooltipContext = createContext(null)

export function TooltipProvider({ children }) {
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, content: null })
  const ref = useRef(null)

  const showTip = useCallback((e, content) => {
    setTip({ visible: true, x: e.clientX + 16, y: e.clientY + 16, content })
  }, [])

  const moveTip = useCallback((e) => {
    setTip((prev) => {
      if (!prev.visible) return prev
      let x = e.clientX + 16
      let y = e.clientY + 16
      const el = ref.current
      if (el) {
        const rect = el.getBoundingClientRect()
        if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - 16
        if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - 16
      }
      return { ...prev, x, y }
    })
  }, [])

  const hideTip = useCallback(() => setTip((prev) => ({ ...prev, visible: false })), [])

  return (
    <TooltipContext.Provider value={{ showTip, moveTip, hideTip }}>
      {children}
      <div
        ref={ref}
        className="fixed pointer-events-none bg-panel2 border border-linebright rounded-lg px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink shadow-[0_8px_24px_rgba(0,0,0,.4)] z-[950] max-w-[240px]"
        style={{ left: tip.x, top: tip.y, display: tip.visible ? 'block' : 'none' }}
      >
        {tip.content}
      </div>
    </TooltipContext.Provider>
  )
}

export function useTooltip() {
  const ctx = useContext(TooltipContext)
  if (!ctx) throw new Error('useTooltip must be used within TooltipProvider')
  return ctx
}
