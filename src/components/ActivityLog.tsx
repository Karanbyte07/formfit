import { useApp } from '../state/context'
import type { ActivityLogEntry } from '../types'

const DOT: Record<ActivityLogEntry['type'], string> = {
  info: 'var(--color-muted)',
  success: 'var(--color-success)',
  warn: 'var(--color-warning)',
  error: 'var(--color-error)',
}

export default function ActivityLog() {
  const { state } = useApp()
  const entries = state.activityLog

  return (
    <div
      className="rounded-xl overflow-hidden shrink-0"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div
        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide flex items-center justify-between"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Activity Log</span>
        <span className="text-[11px] font-mono font-normal normal-case" style={{ color: 'var(--color-muted)' }}>
          {entries.length} {entries.length === 1 ? 'event' : 'events'}
        </span>
      </div>
      <div
        style={{ background: 'var(--color-surface)' }}
        className="max-h-[160px] overflow-y-auto"
      >
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 px-3 py-1.5 transition-colors duration-100 hover:bg-black/[0.02]"
            style={{
              borderBottom: i < entries.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}
          >
            <span
              className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: DOT[entry.type] || 'var(--color-muted)' }}
            />
            <span className="text-[11px] font-mono flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
              {entry.time}
            </span>
            <span
              className="text-xs flex-1 leading-snug break-words"
              style={{
                color: entry.type === 'error' ? 'var(--color-error)' : 'var(--color-text)',
              }}
            >
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
