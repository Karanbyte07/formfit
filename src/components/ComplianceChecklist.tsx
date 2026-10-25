import { CheckCircle2, XCircle } from 'lucide-react'
import { useApp, useActiveSlot } from '../state/context'
import { formatFileSize, calculateMaxAllowedBytes, kbToBytes } from '../lib/units'

export default function ComplianceChecklist() {
  const { state, dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const targets = activeSlot.targets || {}
  const settings = state.settings
  const kbBase = settings.kbBase
  const result = activeSlot.result
  const measured = result?.measured

  const hasImage = Boolean(activeSlot.original)

  // 1. File Size Evaluation
  const hasSizeTarget = targets.maxKb !== undefined || targets.minKb !== undefined
  let sizeExpected = 'No target'
  if (targets.minKb && targets.maxKb) {
    sizeExpected = `${targets.minKb}–${targets.maxKb} KB`
  } else if (targets.maxKb) {
    sizeExpected = `≤ ${targets.maxKb} KB`
  } else if (targets.minKb) {
    sizeExpected = `≥ ${targets.minKb} KB`
  }

  const measuredBytes = measured?.bytes ?? (result?.blob?.size ?? 0)
  const maxAllowedBytes = targets.maxKb
    ? calculateMaxAllowedBytes(targets.maxKb, kbBase, settings.safetyMargin)
    : undefined
  const minAllowedBytes = targets.minKb ? kbToBytes(targets.minKb, kbBase) : undefined

  let sizePass = true
  let sizeFixSuggestion = ''
  if (hasSizeTarget && hasImage) {
    if (maxAllowedBytes && measuredBytes > maxAllowedBytes) {
      sizePass = false
      sizeFixSuggestion = 'Try a simpler background or a lower pixel size if the form allows.'
    } else if (minAllowedBytes && measuredBytes < minAllowedBytes) {
      sizePass = false
      sizeFixSuggestion = 'File size is below minimum required KB; try a higher resolution or quality.'
    }
  }

  // 2. Dimensions Evaluation
  const hasDimTarget = targets.widthPx !== undefined && targets.heightPx !== undefined
  const dimExpected = hasDimTarget ? `${targets.widthPx} × ${targets.heightPx} px` : 'No target'
  const measuredWidth = measured?.width ?? (result?.width ?? activeSlot.originalWidth ?? 0)
  const measuredHeight = measured?.height ?? (result?.height ?? activeSlot.originalHeight ?? 0)

  let dimPass = true
  let dimFixSuggestion = ''
  if (hasDimTarget && hasImage) {
    if (measuredWidth !== targets.widthPx || measuredHeight !== targets.heightPx) {
      dimPass = false
      dimFixSuggestion = 'Check dimensions; center-crop or resize to match exact target aspect ratio.'
    }
  }

  // 3. Format Evaluation
  const hasFormatTarget = targets.format !== undefined
  const formatExpected = targets.format
    ? targets.format === 'jpeg'
      ? 'JPG'
      : targets.format.toUpperCase()
    : 'No target'

  const measuredFormat = measured?.mime
    ? measured.mime.includes('png')
      ? 'PNG'
      : 'JPG'
    : result?.format
      ? result.format === 'jpeg'
        ? 'JPG'
        : result.format.toUpperCase()
      : activeSlot.fileName
        ? /\.png$/i.test(activeSlot.fileName)
          ? 'PNG'
          : 'JPG'
        : 'JPG'

  let formatPass = true
  let formatFixSuggestion = ''
  if (hasFormatTarget && hasImage && targets.format) {
    const targetFmtNormalized = targets.format === 'jpeg' ? 'JPG' : targets.format.toUpperCase()
    if (measuredFormat !== targetFmtNormalized) {
      formatPass = false
      formatFixSuggestion = `Export or convert image to ${targetFmtNormalized} format.`
    } else if (result?.status === 'png_kb_unsupported') {
      formatPass = false
      formatFixSuggestion = 'PNG does not support quality compression. Switch to JPG to meet KB limits.'
    }
  }

  // Collect checked rows
  const allRows = [
    {
      id: 'filesize',
      label: 'File size',
      hasTarget: hasSizeTarget,
      expected: sizeExpected,
      actual: hasImage && measuredBytes > 0 ? formatFileSize(measuredBytes, kbBase) : undefined,
      pass: sizePass,
      suggestion: sizeFixSuggestion,
    },
    {
      id: 'dimensions',
      label: 'Dimensions',
      hasTarget: hasDimTarget,
      expected: dimExpected,
      actual: hasImage && measuredWidth > 0 ? `${measuredWidth} × ${measuredHeight} px` : undefined,
      pass: dimPass,
      suggestion: dimFixSuggestion,
    },
    {
      id: 'format',
      label: 'Format',
      hasTarget: hasFormatTarget,
      expected: formatExpected,
      actual: hasImage ? measuredFormat : undefined,
      pass: formatPass,
      suggestion: formatFixSuggestion,
    },
  ]

  const checkedRows = allRows.filter(r => r.hasTarget)
  const passCount = checkedRows.filter(r => r.pass).length
  const totalCount = checkedRows.length

  const handleSwitchToJpg = () => {
    dispatch({
      type: 'SET_TARGETS',
      slotId: activeSlot.id,
      targets: { format: 'jpeg' },
    })
  }

  return (
    <div
      className="rounded-xl overflow-hidden shrink-0"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide flex items-center justify-between"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        <span>Compliance Check</span>
        {totalCount === 0 ? (
          <span className="text-[11px] font-normal normal-case px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            No targets set yet
          </span>
        ) : (
          <span
            className="text-[11px] font-medium normal-case px-2 py-0.5 rounded-full"
            style={
              passCount === totalCount
                ? { background: '#F0FDF4', color: 'var(--color-success)' }
                : { background: '#FEF3C7', color: 'var(--color-warning)' }
            }
          >
            {passCount}/{totalCount} passing
          </span>
        )}
      </div>

      {/* Rows */}
      <div style={{ background: 'var(--color-surface)' }}>
        {totalCount === 0 ? (
          <div className="px-3 py-3 text-xs text-center" style={{ color: 'var(--color-muted)' }}>
            No form targets set yet. Try saying or typing: &quot;50 KB se kam, 200x230 px&quot;.
          </div>
        ) : (
          checkedRows.map((row, i) => (
            <div
              key={row.id}
              className="flex flex-col px-3 py-2"
              style={{
                borderBottom: i < checkedRows.length - 1 ? '1px solid var(--color-border)' : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                {row.pass ? (
                  <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                ) : (
                  <XCircle size={16} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                      {row.label}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                      style={
                        row.pass
                          ? { background: '#F0FDF4', color: 'var(--color-success)' }
                          : { background: '#FEF2F2', color: 'var(--color-error)' }
                      }
                    >
                      {row.expected}
                    </span>
                  </div>
                  {row.actual && (
                    <span className="text-[11px] text-gray-500 block mt-0.5">
                      Measured: <span className="font-medium text-gray-700">{row.actual}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Fix suggestion on fail */}
              {!row.pass && row.suggestion && (
                <div className="mt-1.5 ml-7 text-[11px] text-amber-800 bg-amber-50 rounded px-2 py-1 border border-amber-200/70 flex items-start justify-between gap-1">
                  <span>{row.suggestion}</span>
                  {row.id === 'format' && result?.status === 'png_kb_unsupported' && (
                    <button
                      className="text-[10px] bg-teal-700 hover:bg-teal-800 text-white font-medium px-2 py-0.5 rounded shrink-0"
                      onClick={handleSwitchToJpg}
                    >
                      Switch to JPG
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
