import { useState } from 'react'
import TopBar from './components/TopBar'
import PreviewPanel from './components/PreviewPanel'
import RightPanel from './components/RightPanel'
import CommandBox from './components/CommandBox'
import type { TabId } from './types'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('photo')

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', minHeight: '100vh', background: 'var(--color-bg)' }}
    >
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fileName="passport_photo.jpg"
        fileSize="187 KB"
      />

      {/* ── Main content ──────────────────────────────────────────── */}
      {/*
        Desktop: PreviewPanel (~60%) + RightPanel (~40%) side by side
        Mobile:  PreviewPanel stacked above, CommandBox sticky at bottom
      */}
      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* Preview – takes ~60% on md+ */}
        <div
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
          style={{ minWidth: 0 }}
        >
          <PreviewPanel />
        </div>

        {/* Right panel – hidden on small screens, shown from md up */}
        <div className="hidden md:flex min-h-0">
          <RightPanel />
        </div>
      </main>

      {/* ── Mobile sticky command box ────────────────────────────── */}
      <div
        className="md:hidden"
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
  )
}
