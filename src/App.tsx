import { useEffect, useState } from 'react'
import { AppProvider, useActiveSlot, useApp } from './state/context'
import TopBar from './components/TopBar'
import PreviewPanel from './components/PreviewPanel'
import RightPanel from './components/RightPanel'
import CommandBar from './components/CommandBar'
import ErrorBoundary from './components/ErrorBoundary'
import { formatFileSize } from './lib/units'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

function AriaLiveAnnouncer() {
  const { state } = useApp()
  const activeSlot = useActiveSlot()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (!activeSlot.result) return
    const { result, targets } = activeSlot
    if (result.ok && result.measured) {
      const kbStr = formatFileSize(result.measured.bytes, state.settings.kbBase)
      const mimeStr = result.measured.mime.includes('png') ? 'PNG' : 'JPEG'
      const dimStr = `${result.measured.width} by ${result.measured.height} pixels`
      
      let passMsg = 'all checks passing'
      if (targets.maxKb && result.measured.bytes > targets.maxKb * 1024) {
        passMsg = 'file size exceeds limit'
      }
      setAnnouncement(`Ready: ${kbStr}, ${dimStr}, ${mimeStr}, ${passMsg}`)
    } else if (!result.ok || result.status === 'failed') {
      setAnnouncement(`Processing error: ${result.message || 'Operation failed'}`)
    }
  }, [activeSlot.result, activeSlot.targets, state.settings.kbBase])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
    >
      {announcement}
    </div>
  )
}

export default function App() {
  const isMobile = useIsMobile()

  return (
    <ErrorBoundary>
      <AppProvider>
        <AriaLiveAnnouncer />
        <div
          className="flex flex-col w-full"
          style={{ height: '100dvh', minHeight: '100vh', background: 'var(--color-bg)', overflow: 'hidden' }}
        >
          {/* ── Top bar — always full viewport width ───────────────── */}
          <TopBar />

          {/* ── Main area — two-column grid on desktop, single column on mobile ─────────────── */}
          <main
            className="flex-1 min-h-0 overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gridTemplateRows: '1fr',
            }}
          >
            {isMobile ? (
              /* Mobile: single-column preview */
              <div className="overflow-y-auto">
                <PreviewPanel />
              </div>
            ) : (
              /* Desktop: two-column grid */
              <div
                className="grid flex-1 min-h-0 w-full h-full"
                style={{
                  gridTemplateColumns: 'minmax(0, 1fr) 440px',
                  gridTemplateRows: '1fr',
                  overflow: 'hidden',
                }}
              >
                {/* Left — preview, fills remaining space, scrolls independently */}
                <div className="min-h-0 overflow-y-auto" style={{ minWidth: 0 }}>
                  <PreviewPanel />
                </div>

                {/* Right — fixed-width sidebar, scrolls independently */}
                <RightPanel />
              </div>
            )}
          </main>

          {/* ── Mobile sticky command box (only rendered on mobile) ───────────────────────────── */}
          {isMobile && (
            <div
              className="flex-shrink-0"
              style={{
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                padding: '12px 16px',
                boxShadow: '0 -4px 16px 0 rgba(20,33,31,0.08)',
              }}
            >
              <CommandBar />
            </div>
          )}
        </div>
      </AppProvider>
    </ErrorBoundary>
  )
}
