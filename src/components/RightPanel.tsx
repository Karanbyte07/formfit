import CommandBox from './CommandBox'
import ExampleChips from './ExampleChips'
import PrivacyBadge from './PrivacyBadge'
import UnderstoodChips from './UnderstoodChips'
import ComplianceChecklist from './ComplianceChecklist'
import ActivityLog from './ActivityLog'

export default function RightPanel() {
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
      {/* (a) Heading */}
      <div className="shrink-0">
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

      {/* (b) Command box + (c) hint */}
      <CommandBox />

      {/* (d) Privacy badge */}
      <PrivacyBadge />

      {/* (e) Try saying chips */}
      <ExampleChips />

      {/* Divider */}
      <hr className="shrink-0 my-0.5" style={{ borderColor: 'var(--color-border)' }} />

      {/* (f) Understood chips */}
      <UnderstoodChips />

      {/* (g) Compliance checklist */}
      <ComplianceChecklist />

      {/* (h) Activity log */}
      <ActivityLog />
    </aside>
  )
}
