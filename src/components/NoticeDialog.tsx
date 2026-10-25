/**
 * NoticeDialog.tsx — "Paste form notice" extractor dialog (spec § 10, § 11.1)
 *
 * Allows user to paste or dictate exam/form notices, reviews live extracted
 * rules per slot (Photo, Signature, Thumb), and applies them with 1 click.
 */
import { useState, useMemo } from 'react'
import {
  FileText,
  X,
  Check,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Trash2,
} from 'lucide-react'
import { extractNoticeRules, type NoticeProposal } from '../lib/notice/extractRules'
import { useApp } from '../state/context'
import type { Intent, SlotId } from '../types'

interface NoticeDialogProps {
  open: boolean
  onClose: () => void
}

const SAMPLE_NOTICE = `Candidate Photograph:
- Dimensions: 200 x 230 pixels
- File size: between 20 to 50 KB
- Format: JPG format with plain white background

Signature:
- Dimensions: 140 x 60 pixels
- File size: 10 to 20 KB
- Format: JPEG format

Left Thumb Impression:
- Dimensions: 240 x 240 pixels
- File size: not more than 50 KB
- Format: JPG format`

function chipLabel(intent: Intent): string {
  switch (intent.kind) {
    case 'resize_px':   return `Resize ${intent.width}×${intent.height} px`
    case 'resize_cm':   return `Resize ${intent.widthCm}×${intent.heightCm} cm`
    case 'max_kb':      return `Max ${intent.kb} KB`
    case 'min_kb':      return `Min ${intent.kb} KB`
    case 'format':      return intent.format === 'jpeg' ? 'JPG' : 'PNG'
    case 'white_bg':    return 'White Background'
    default:            return intent.kind
  }
}

export default function NoticeDialog({ open, onClose }: NoticeDialogProps) {
  const { state, dispatch } = useApp()
  const [text, setText] = useState('')
  // Local edited proposals allowing user to delete chips or cards before applying
  const [editedProposals, setEditedProposals] = useState<NoticeProposal[] | null>(null)

  // Live extraction from current text
  const extracted = useMemo(() => {
    return extractNoticeRules(text, {
      defaultDpi: state.settings.dpi,
      activeSlot: state.activeSlot,
    })
  }, [text, state.settings.dpi, state.activeSlot])

  // Active proposals are edited proposals if user interacted, else extracted
  const currentProposals = editedProposals ?? extracted.proposals

  const handleTextChange = (val: string) => {
    setText(val)
    setEditedProposals(null) // reset manual edits on fresh paste
  }

  const handleFillSample = () => {
    handleTextChange(SAMPLE_NOTICE)
  }

  const handleRemoveChip = (slotId: SlotId, intentIndex: number) => {
    const updated = currentProposals.map(p => {
      if (p.slot !== slotId) return p
      return {
        ...p,
        intents: p.intents.filter((_, i) => i !== intentIndex),
      }
    }).filter(p => p.intents.length > 0)
    setEditedProposals(updated)
  }

  const handleRemoveSlot = (slotId: SlotId) => {
    const updated = currentProposals.filter(p => p.slot !== slotId)
    setEditedProposals(updated)
  }

  const handleApply = () => {
    if (currentProposals.length === 0) return

    dispatch({
      type: 'APPLY_NOTICE_PROPOSALS',
      proposals: currentProposals.map(p => ({
        slot: p.slot,
        intents: p.intents,
      })),
    })

    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-dialog-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h3 id="notice-dialog-title" className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                Paste Form Notice
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Extract targets for Photo, Signature, and Thumb automatically
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Textarea input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="notice-textarea"
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-muted)' }}
              >
                Form instructions or notice text
              </label>
              <button
                type="button"
                className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-accent)' }}
                onClick={handleFillSample}
              >
                <Sparkles size={13} /> Try sample notice
              </button>
            </div>

            <textarea
              id="notice-textarea"
              rows={4}
              className="w-full p-3 rounded-xl text-xs font-mono leading-relaxed outline-none transition-all resize-y"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              placeholder="Paste notification guidelines here, e.g.:&#10;Candidate Photograph: 200 x 230 px, between 20 to 50 KB, JPG.&#10;Signature: 140 x 60 px, 10 to 20 KB, JPG."
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              autoFocus
            />
          </div>

          {/* Honesty disclaimer (Spec § 10.2) */}
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#92400E',
            }}
          >
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-snug">
              <strong>Notice:</strong> Rules shown are read from the text you pasted. Always double-check them against your official form notification.
            </p>
          </div>

          {/* Extracted Proposals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Extracted Slot Rules {currentProposals.length > 0 && `(${currentProposals.length} detected)`}
            </h4>

            {currentProposals.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center p-6 rounded-xl text-center space-y-2"
                style={{ background: 'var(--color-bg)', border: '1px dashed var(--color-border)' }}
              >
                <HelpCircle size={28} style={{ color: 'var(--color-muted)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                  {text.trim() ? "Couldn't detect rules in this text." : 'Paste notice text above or test the sample notice.'}
                </p>
                <button
                  className="btn-secondary text-xs py-1 px-3 mt-1"
                  onClick={handleFillSample}
                >
                  <Sparkles size={13} style={{ color: 'var(--color-accent)' }} /> Load 3-slot sample notice
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {currentProposals.map(proposal => {
                  const slotLabel =
                    proposal.slot === 'photo'
                      ? 'Photograph'
                      : proposal.slot === 'signature'
                      ? 'Signature'
                      : 'Left Thumb'

                  return (
                    <div
                      key={proposal.slot}
                      className="p-3.5 rounded-xl space-y-2 transition-all"
                      style={{
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                            style={{
                              background: 'var(--color-accent-soft)',
                              color: 'var(--color-accent)',
                            }}
                          >
                            {slotLabel}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                            Confidence: {Math.round(proposal.confidence * 100)}%
                          </span>
                        </div>

                        <button
                          className="p-1 rounded text-xs transition-colors hover:bg-red-50 text-red-600"
                          title={`Exclude ${slotLabel}`}
                          onClick={() => handleRemoveSlot(proposal.slot)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Snippet highlight */}
                      <p
                        className="text-[11px] font-mono p-2 rounded-lg"
                        style={{
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-muted)',
                        }}
                      >
                        &quot;{proposal.sourceSnippet}&quot;
                      </p>

                      {/* Intents Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proposal.intents.map((intent, i) => (
                          <span
                            key={i}
                            className="chip-result inline-flex items-center gap-1.5 py-0.5 pl-2 pr-1.5 text-xs rounded-full"
                          >
                            <Check size={11} style={{ color: 'var(--color-success)' }} />
                            <span>{chipLabel(intent)}</span>
                            <button
                              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                              onClick={() => handleRemoveChip(proposal.slot, i)}
                              title="Remove rule"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 border-t shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <button className="btn-secondary text-xs py-1.5 px-4" onClick={onClose}>
            Cancel
          </button>

          <button
            id="btn-apply-notice"
            className="btn-primary text-xs py-1.5 px-5 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={currentProposals.length === 0}
            onClick={handleApply}
          >
            Apply to {currentProposals.length} Slot{currentProposals.length === 1 ? '' : 's'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
