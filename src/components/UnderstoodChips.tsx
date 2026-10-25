import { useState } from 'react'
import { X, Check, Sparkles, Tag } from 'lucide-react'
import type { Intent } from '../types'
import { useApp, useActiveSlot } from '../state/context'

/** Human-readable chip label for an intent */
function chipLabel(intent: Intent): string {
  switch (intent.kind) {
    case 'resize_px':       return `Resize ${intent.width}×${intent.height} px`
    case 'resize_cm':       return `Resize ${intent.widthCm}×${intent.heightCm} cm @ ${intent.dpi} dpi`
    case 'max_kb':          return `Max ${intent.kb} KB`
    case 'min_kb':          return `Min ${intent.kb} KB`
    case 'format':          return intent.format === 'jpeg' ? 'JPG' : 'PNG'
    case 'rotate':          return `Rotate ${intent.degrees}°`
    case 'flip':            return intent.axis === 'h' ? 'Flip Horizontal' : 'Flip Vertical'
    case 'grayscale':       return 'Grayscale'
    case 'white_bg':        return 'White Background'
    case 'brightness':      return `Brightness ${intent.delta > 0 ? '+' : ''}${intent.delta}`
    case 'contrast':        return `Contrast ${intent.delta > 0 ? '+' : ''}${intent.delta}`
    case 'crop':            return intent.rect ? `Crop (${intent.rect.w}×${intent.rect.h})` : 'Crop'
    case 'signature_clean': return 'Clean Signature'
    case 'overlay_text':    return 'Name & Date Strip'
    default:                return intent.kind
  }
}

interface ChipField {
  label: string
  field: string
  value: string | number
  type: 'number' | 'text'
}

/** Returns the editable fields for an intent */
function getEditableFields(intent: Intent): ChipField[] {
  switch (intent.kind) {
    case 'resize_px':
      return [
        { label: 'W', field: 'width', value: intent.width, type: 'number' },
        { label: 'H', field: 'height', value: intent.height, type: 'number' },
      ]
    case 'resize_cm':
      return [
        { label: 'W(cm)', field: 'widthCm', value: intent.widthCm, type: 'number' },
        { label: 'H(cm)', field: 'heightCm', value: intent.heightCm, type: 'number' },
        { label: 'DPI', field: 'dpi', value: intent.dpi, type: 'number' },
      ]
    case 'max_kb':
    case 'min_kb':
      return [{ label: 'KB', field: 'kb', value: intent.kb, type: 'number' }]
    case 'brightness':
    case 'contrast':
      return [{ label: 'Δ', field: 'delta', value: intent.delta, type: 'number' }]
    case 'rotate':
      return [{ label: '°', field: 'degrees', value: intent.degrees, type: 'number' }]
    case 'signature_clean':
      return [{ label: 'Th', field: 'threshold', value: intent.threshold, type: 'number' }]
    case 'overlay_text':
      return [
        { label: 'Name', field: 'text', value: intent.text, type: 'text' },
        { label: 'Date', field: 'date', value: intent.date || '', type: 'text' },
      ]
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

  const startEdit = (field: string, current: string | number) => {
    setEditing(field)
    setEditVal(String(current))
  }

  const commitEdit = (field: string, type: 'number' | 'text') => {
    if (type === 'text') {
      const updated = { ...intent, [field]: editVal.trim() } as Intent
      onUpdate(index, updated)
    } else {
      const num = parseFloat(editVal)
      if (!isNaN(num)) {
        if (field === 'delta' || num > 0) {
          const updated = { ...intent, [field]: num } as Intent
          onUpdate(index, updated)
        }
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
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={editVal}
                  autoFocus
                  className="w-16 text-xs rounded px-1 outline-none font-mono"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-accent)',
                    color: 'var(--color-text)',
                  }}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={() => commitEdit(f.field, f.type)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(f.field, f.type)
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
                  {String(f.value) || '(set)'}
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

  const handleUpdate = (index: number, updated: Intent) => {
    dispatch({ type: 'UPDATE_CHIP', slotId: activeSlot.id, index, intent: updated })
  }

  const handleRemove = (index: number) => {
    dispatch({ type: 'REMOVE_CHIP', slotId: activeSlot.id, index })
  }

  const hasSigClean = ops.some(op => op.kind === 'signature_clean')
  const hasOverlay = ops.some(op => op.kind === 'overlay_text')

  const handleAddSigClean = () => {
    dispatch({
      type: 'APPLY_PARSED_INTENTS',
      slotId: activeSlot.id,
      intents: [{ kind: 'signature_clean', threshold: 165 }],
    })
  }

  const handleAddOverlay = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear())
    dispatch({
      type: 'APPLY_PARSED_INTENTS',
      slotId: activeSlot.id,
      intents: [{ kind: 'overlay_text', text: 'CANDIDATE NAME', date: `${day}/${month}/${year}` }],
    })
  }

  return (
    <div className="space-y-1.5 shrink-0" aria-live="polite" aria-label="Understood commands">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
          I understood {ops.length > 0 && `(${ops.length})`}
        </p>

        {/* Quick action badges for signature clean or name strip */}
        <div className="flex items-center gap-1.5">
          {(activeSlot.id === 'signature' || activeSlot.id === 'thumb') && !hasSigClean && (
            <button
              id="btn-quick-clean-sig"
              onClick={handleAddSigClean}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
              title="Enhance contrast and whiten paper background"
            >
              <Sparkles size={11} /> Clean ink
            </button>
          )}

          {activeSlot.id === 'photo' && !hasOverlay && (
            <button
              id="btn-quick-add-overlay"
              onClick={handleAddOverlay}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
              title="Add candidate name & date strip at bottom of photo"
            >
              <Tag size={11} /> + Name/Date strip
            </button>
          )}
        </div>
      </div>

      {ops.length === 0 ? (
        <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
          No active rules. Speak or type above to add targets.
        </p>
      ) : (
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
      )}
    </div>
  )
}
