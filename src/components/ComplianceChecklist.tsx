import { CheckCircle2, XCircle } from 'lucide-react'

interface ChecklistRow {
  id: string
  label: string
  expected: string
  status: 'pass' | 'fail' | 'pending'
}

const ROWS: ChecklistRow[] = [
  { id: 'filesize', label: 'File size', expected: '≤ 50 KB', status: 'pass' },
  { id: 'dimensions', label: 'Dimensions', expected: '200 × 230 px', status: 'fail' },
  { id: 'format', label: 'Format', expected: 'JPG', status: 'pass' },
]

export default function ComplianceChecklist() {
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
        <span>Compliance Check</span>
        <span
          className="text-[11px] font-medium normal-case px-2 py-0.5 rounded-full"
          style={{ background: '#FEF3C7', color: 'var(--color-warning)' }}
        >
          2/3 passing
        </span>
      </div>
      <div style={{ background: 'var(--color-surface)' }}>
        {ROWS.map((row, i) => (
          <div
            key={row.id}
            className="flex items-center gap-3 px-3 py-2"
            style={{
              borderBottom: i < ROWS.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}
          >
            {row.status === 'pass' ? (
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            ) : (
              <XCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            )}
            <span className="flex-1 text-xs font-medium" style={{ color: 'var(--color-text)' }}>
              {row.label}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={
                row.status === 'pass'
                  ? {
                      background: '#F0FDF4',
                      color: 'var(--color-success)',
                    }
                  : {
                      background: '#FEF2F2',
                      color: 'var(--color-error)',
                    }
              }
            >
              {row.expected}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
