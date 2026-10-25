/**
 * PresetsPanel.tsx — Editable form rule presets (spec § 4.2 S4)
 *
 * Provides pre-packaged example presets and allows saving/applying custom presets
 * safely backed by localStorage with a zero-crash policy.
 */
import { useState } from 'react'
import { Bookmark, Plus, Trash2, ArrowRight, AlertCircle, Check } from 'lucide-react'
import { useApp, useActiveSlot } from '../state/context'
import type { Preset } from '../types'
import { saveStoredPresets } from '../lib/storage'

export default function PresetsPanel() {
  const { state, dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const [newPresetName, setNewPresetName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastAppliedId, setLastAppliedId] = useState<string | null>(null)

  const presets = state.presets || []
  const hasActiveRules = activeSlot.ops.length > 0 || Boolean(activeSlot.targets.widthPx || activeSlot.targets.maxKb)

  const handleApplyPreset = (preset: Preset) => {
    dispatch({ type: 'APPLY_PRESET', preset })
    setLastAppliedId(preset.id)
    setTimeout(() => setLastAppliedId(null), 2000)
  }

  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPresetName.trim() || !hasActiveRules) return

    const newPreset: Preset = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newPresetName.trim(),
      slot: activeSlot.id,
      targets: { ...activeSlot.targets },
      ops: [...activeSlot.ops],
      isDefault: false,
    }

    const updated = [...presets, newPreset]
    saveStoredPresets(updated)
    dispatch({ type: 'SAVE_PRESET', preset: newPreset })
    setNewPresetName('')
    setIsSaving(false)
  }

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = presets.filter(p => p.id !== id)
    saveStoredPresets(updated)
    dispatch({ type: 'DELETE_PRESET', presetId: id })
  }

  return (
    <div
      className="rounded-xl p-3 space-y-2.5 text-xs"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-text)' }}>
          <Bookmark size={14} style={{ color: 'var(--color-accent)' }} />
          <span>Rule Presets</span>
        </div>

        {hasActiveRules && (
          <button
            onClick={() => setIsSaving(!isSaving)}
            className="text-[11px] font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{ color: 'var(--color-accent)' }}
          >
            <Plus size={12} /> {isSaving ? 'Cancel' : 'Save current rules'}
          </button>
        )}
      </div>

      {/* Save current preset input form */}
      {isSaving && (
        <form onSubmit={handleSaveCurrentAsPreset} className="space-y-1.5 p-2 rounded-lg bg-black/5 dark:bg-white/5">
          <p className="text-[10px] text-gray-500">
            Save {activeSlot.ops.length} active rules for {activeSlot.id.toUpperCase()} slot:
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. UPSC Photo 2026"
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
              className="flex-1 px-2 py-1 rounded text-xs outline-none"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newPresetName.trim()}
              className="btn-primary py-1 px-2.5 text-xs disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Preset cards list */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {presets.map(preset => {
          const isJustApplied = lastAppliedId === preset.id
          return (
            <div
              key={preset.id}
              className="p-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer group"
              style={{
                background: isJustApplied ? 'var(--color-accent-soft)' : 'var(--color-bg)',
                border: '1px solid var(--color-border)',
              }}
              onClick={() => handleApplyPreset(preset)}
              title={`Click to apply rules to ${preset.slot || 'current'} slot`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {preset.name}
                </p>
                {preset.slot && (
                  <span className="text-[10px] text-gray-400 capitalize">
                    {preset.slot} slot
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isJustApplied ? (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                    <Check size={12} /> Applied
                  </span>
                ) : (
                  <button
                    className="p-1 rounded hover:bg-black/10 text-gray-400 group-hover:text-teal-600 transition-colors"
                    aria-label={`Apply ${preset.name}`}
                  >
                    <ArrowRight size={13} />
                  </button>
                )}

                {/* Only user custom presets can be deleted */}
                {!preset.isDefault && (
                  <button
                    onClick={e => handleDeletePreset(preset.id, e)}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete custom preset"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mandatory honesty disclaimer (Spec § 4.2 S4, § 10.2) */}
      <p className="text-[10px] text-gray-500 flex items-center gap-1 pt-1 leading-snug">
        <AlertCircle size={10} className="shrink-0 text-amber-600" />
        Example presets only — always check your form&apos;s official notice.
      </p>
    </div>
  )
}
