import { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { Intent } from '../types'
import { useApp, useActiveSlot } from '../state/context'

/** Human-readable chip label for an intent */
function chipLabel(intent: Intent): string {
  switch (intent.kind) {
    case 'resize_px':   return `Resize ${intent.width}×${intent.height} px`
    case 'resize_cm':   return `Resize ${intent.widthCm}×${intent.heightCm} cm @ ${intent.dpi} dpi`
    case 'max_kb':      return `Max ${intent.kb} KB`
    case 'min_kb':      return `Min ${intent.kb} KB`
    case 'format':      return intent.format === 'jpeg' ? 'JPG' : 'PNG'
    case 'rotate':      return `Rotate ${intent.degrees}°`
    case 'flip':        return intent.axis === 'h' ? 'Flip Horizontal' : 'Flip Vertical'
    case 'grayscale':   return 'Grayscale'
    case 'white_bg':    return 'White Background'
    case 'brightness':  return `Brightness ${intent.delta > 0 ? '+' : ''}${intent.delta}`
    case 'contrast':    return `Contrast ${intent.delta > 0 ? '+' : ''}${intent.delta}`
    case 'crop':        return 'Crop'
    default:            return intent.kind
  }
}

/** Returns the editable numeric fields for an intent (field name → current value) */
function getEditableFields(intent: Intent): { label: string; field: string; value: number }[] {
  switch (intent.kind) {
    case 'resize_px':
      return [
        { label: 'W', field: 'width', value: intent.width },
        { label: 'H', field: 'height', value: intent.height },
      ]
    case 'resize_cm':
      return [
        { label: 'W(cm)', field: 'widthCm', value: intent.widthCm },
        { label: 'H(cm)', field: 'heightCm', value: intent.heightCm },
        { label: 'DPI', field: 'dpi', value: intent.dpi },
      ]
    case 'max_kb':
    case 'min_kb':
      return [{ label: 'KB', field: 'kb', value: intent.kb }]
    case 'brightness':
    case 'contrast':
      return [{ label: 'Δ', field: 'delta', value: intent.delta }]
    case 'rotate':
      return [{ label: '°', field: 'degrees', value: intent.degrees }]
    default:
      return []
  }
}

/** Inline-editable chip */
function Chip({
  intent,
  index,
  onUpdate,
  onRemove,
}: {
  intent: Intent
  index: number
  onUpdate: (index: number, updated: Intent) => void
  onRemove: (index: number) => void
}) {
  const fields = getEditableFields(intent)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const startEdit = (field: string, current: number) => {
    setEditing(field)
    setEditVal(String(current))
  }

  const commitEdit = (field: string) => {
    const num = parseFloat(editVal)
    if (!isNaN(num)) {
      if (field === 'delta' || num > 0) {
        const updated = { ...intent, [field]: num } as Intent
        onUpdate(index, updated)
      }
    }
    setEditing(null)
  }

  const chipId = `chip-understood-${index}-${intent.kind}`

  return (
    <span
      id={chipId}
      className="chip-result inline-flex items-center gap-1.5 py-0.5 pl-2.5 pr-1.5 text-xs rounded-full"
      style={{ cursor: 'default' }}
    >
      <Check size={11} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
      <span>{chipLabel(intent)}</span>

      {/* Editable fields */}
      {fields.length > 0 && (
        <span className="flex items-center gap-1 ml-0.5">
          {fields.map(f => (
            <span key={f.field} className="flex items-center gap-0.5">
              <span style={{ color: 'var(--color-muted)', fontSize: '10px' }}>{f.label}:</span>
              {editing === f.field ? (
                <input
                  type="number"
                  value={editVal}
                  autoFocus
                  className="w-14 text-xs rounded px-1 outline-none"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-accent)',
                    color: 'var(--color-text)',
                  }}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={() => commitEdit(f.field)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(f.field)
                    if (e.key === 'Escape') setEditing(null)
                  }}
                />
              ) : (
                <button
                  className="underline font-mono"
                  style={{ color: 'var(--color-accent)', fontSize: '11px' }}
                  onClick={() => startEdit(f.field, f.value)}
                  title={`Click to edit ${f.label}`}
                >
                  {f.value}
                </button>
              )}
            </span>
          ))}
        </span>
      )}

      {/* Remove button */}
      <button
        className="ml-0.5 rounded-full p-0.5 transition-colors"
        style={{ color: 'var(--color-muted)' }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        }}
        onClick={() => onRemove(index)}
        title={`Remove ${intent.kind}`}
        aria-label={`Remove ${chipLabel(intent)}`}
      >
        <X size={11} />
      </button>
    </span>
  )
}

export default function UnderstoodChips() {
  const { dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const ops = activeSlot.ops

  if (ops.length === 0) return null

  const handleUpdate = (index: number, updated: Intent) => {
    dispatch({ type: 'UPDATE_CHIP', slotId: activeSlot.id, index, intent: updated })
  }

  const handleRemove = (index: number) => {
    dispatch({ type: 'REMOVE_CHIP', slotId: activeSlot.id, index })
  }

  return (
    <div className="space-y-1.5 shrink-0" aria-live="polite" aria-label="Understood commands">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        I understood
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ops.map((op, i) => (
          <Chip
            key={`${op.kind}-${i}`}
            intent={op}
            index={i}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  )
}
