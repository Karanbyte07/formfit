interface LogEntry {
  id: string
  time: string
  message: string
  type: 'info' | 'success' | 'warn'
}

const FAKE_LOG: LogEntry[] = [
  { id: 'log-1', time: '12:04:02', message: 'Photo loaded · 320 × 450 px · 187 KB', type: 'info' },
  { id: 'log-2', time: '12:04:05', message: 'Resize applied → 200 × 230 px · 42 KB', type: 'success' },
]

const DOT: Record<LogEntry['type'], string> = {
  info: 'var(--color-muted)',
  success: 'var(--color-success)',
  warn: 'var(--color-warning)',
}

export default function ActivityLog() {
  return (
    <div
      className="rounded-xl overflow-hidden shrink-0"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div
        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        Activity Log
      </div>
      <div style={{ background: 'var(--color-surface)' }}>
        {FAKE_LOG.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-start gap-2 px-3 py-1.5"
            style={{
              borderBottom: i < FAKE_LOG.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}
          >
            <span
              className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: DOT[entry.type] }}
            />
            <span className="text-[11px] font-mono flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
              {entry.time}
            </span>
            <span className="text-xs flex-1 leading-snug" style={{ color: 'var(--color-text)' }}>
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
