import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useActiveSlot } from '../state/context'
import { formatBytes } from '../state/reducer'

export default function ComplianceChecklist() {
  const activeSlot = useActiveSlot()
  const hasFile = Boolean(activeSlot.original)

  // Measure dynamic compliance against standard targets (200x230 px, <= 50 KB, JPG)
  const targetWidth = 200
  const targetHeight = 230
  const maxBytes = 50 * 1024

  const currentW = activeSlot.result?.width || activeSlot.originalWidth || 0
  const currentH = activeSlot.result?.height || activeSlot.originalHeight || 0
  const currentSize = activeSlot.fileSize || 0
  const isJpg = activeSlot.fileName ? /\.jpe?g$/i.test(activeSlot.fileName) : true

  const dimensionsPass = hasFile ? currentW === targetWidth && currentH === targetHeight : false
  const sizePass = hasFile ? currentSize <= maxBytes : true
  const formatPass = hasFile ? isJpg : true

  const rows = [
    {
      id: 'filesize',
      label: 'File size',
      expected: '≤ 50 KB',
      actual: hasFile ? formatBytes(currentSize) : undefined,
      status: !hasFile ? 'pass' : sizePass ? 'pass' : 'fail',
    },
    {
      id: 'dimensions',
      label: 'Dimensions',
      expected: `${targetWidth} × ${targetHeight} px`,
      actual: hasFile ? `${currentW} × ${currentH} px` : undefined,
      status: !hasFile ? 'fail' : dimensionsPass ? 'pass' : 'fail',
    },
    {
      id: 'format',
      label: 'Format',
      expected: 'JPG',
      actual: hasFile ? (isJpg ? 'JPG' : 'PNG/WebP') : undefined,
      status: !hasFile ? 'pass' : formatPass ? 'pass' : 'fail',
    },
  ]

  const passCount = rows.filter(r => r.status === 'pass').length

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
          style={
            passCount === rows.length
              ? { background: '#F0FDF4', color: 'var(--color-success)' }
              : { background: '#FEF3C7', color: 'var(--color-warning)' }
          }
        >
          {passCount}/{rows.length} passing
        </span>
      </div>
      <div style={{ background: 'var(--color-surface)' }}>
        {rows.map((row, i) => (
          <div
            key={row.id}
            className="flex items-center gap-3 px-3 py-2"
            style={{
              borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : undefined,
            }}
          >
            {row.status === 'pass' ? (
              <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            ) : row.status === 'fail' ? (
              <XCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            ) : (
              <Clock size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium block truncate" style={{ color: 'var(--color-text)' }}>
                {row.label}
              </span>
              {row.actual && (
                <span className="text-[10px] text-gray-500 block">
                  Current: {row.actual}
                </span>
              )}
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
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
