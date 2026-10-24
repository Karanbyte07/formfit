import { AppProvider } from './state/context'
import TopBar from './components/TopBar'
import PreviewPanel from './components/PreviewPanel'
import RightPanel from './components/RightPanel'
import CommandBox from './components/CommandBox'

export default function App() {
  return (
    <AppProvider>
      <div
        className="flex flex-col w-full"
        style={{ height: '100dvh', minHeight: '100vh', background: 'var(--color-bg)', overflow: 'hidden' }}
      >
        {/* ── Top bar — always full viewport width ───────────────── */}
        <TopBar />

        {/* ── Main area — two-column grid on desktop ─────────────── */}
        <main
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gridTemplateRows: '1fr',
          }}
        >
          {/* Desktop: two-column grid */}
          <div
            className="hidden md:grid flex-1 min-h-0 w-full h-full"
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

          {/* Mobile: single-column preview */}
          <div className="md:hidden overflow-y-auto">
            <PreviewPanel />
          </div>
        </main>

        {/* ── Mobile sticky command box ───────────────────────────── */}
        <div
          className="md:hidden flex-shrink-0"
          style={{
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            padding: '12px 16px',
            boxShadow: '0 -4px 16px 0 rgba(20,33,31,0.08)',
          }}
        >
          <CommandBox />
        </div>
      </div>
    </AppProvider>
  )
}
