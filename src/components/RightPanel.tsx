import { useState, useRef, useCallback } from 'react'
import { Settings } from 'lucide-react'
import CommandBar from './CommandBar'
import ExampleChips from './ExampleChips'
import PrivacyBadge from './PrivacyBadge'
import UnderstoodChips from './UnderstoodChips'
import PresetsPanel from './PresetsPanel'
import ComplianceChecklist from './ComplianceChecklist'
import ActivityLog from './ActivityLog'
import { useApp } from '../state/context'

function KbSettingsPopover() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const toggleKbBase = (base: 1024 | 1000) => {
    dispatch({ type: 'SET_SETTINGS', settings: { kbBase: base } })
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        id="btn-settings"
        className="p-1.5 rounded-lg transition-colors duration-150"
        style={{ color: 'var(--color-muted)' }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }}
        onClick={() => setOpen(v => !v)}
        title="Settings"
        aria-label="Settings"
      >
        <Settings size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-7 z-50 rounded-xl p-3 space-y-2 w-56"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
            1 KB =
          </p>
          <div className="flex gap-2">
            <button
              id="settings-kb-1024"
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={
                state.settings.kbBase === 1024
                  ? { background: 'var(--color-accent)', color: '#fff' }
                  : { background: 'var(--color-bg)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
              }
              onClick={() => toggleKbBase(1024)}
            >
              1024 bytes
            </button>
            <button
              id="settings-kb-1000"
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={
                state.settings.kbBase === 1000
                  ? { background: 'var(--color-accent)', color: '#fff' }
                  : { background: 'var(--color-bg)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }
              }
              onClick={() => toggleKbBase(1000)}
            >
              1000 bytes
            </button>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
            Most forms use 1024. Use 1000 only if specified.
          </p>
        </div>
      )}
    </div>
  )
}

export default function RightPanel() {
  const [filledCommand, setFilledCommand] = useState<string | undefined>(undefined)
  const fillVersion = useRef(0)

  const handleRunCommand = useCallback((cmd: string) => {
    // Increment to force re-render even if same command is clicked twice
    fillVersion.current++
    setFilledCommand(cmd + '\u200b'.repeat(fillVersion.current % 5))
  }, [])

  return (
    <aside
      className="flex flex-col gap-3 overflow-y-auto p-4 pb-6 h-full min-h-0 w-full"
      style={{
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxSizing: 'border-box',
      }}
      aria-label="Command and settings panel"
    >
      {/* (a) Heading + settings gear */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h2
            className="text-base font-bold leading-snug"
            style={{ color: 'var(--color-text)' }}
          >
            Is image ko kaise ready karna hai?
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            Apni requirements neeche type karo ya bolo.
          </p>
        </div>
        <KbSettingsPopover />
      </div>

      {/* (b) Command box */}
      <CommandBar filledCommand={filledCommand} />

      {/* (c) Privacy badge */}
      <PrivacyBadge />

      {/* (d) Try saying chips */}
      <ExampleChips onRunCommand={handleRunCommand} />

      {/* Divider */}
      <hr className="shrink-0 my-0.5" style={{ borderColor: 'var(--color-border)' }} />

      {/* Presets panel */}
      <PresetsPanel />

      {/* (e) Understood chips */}
      <UnderstoodChips />

      {/* (f) Compliance checklist */}
      <ComplianceChecklist />

      {/* (g) Activity log */}
      <ActivityLog />
    </aside>
  )
}
