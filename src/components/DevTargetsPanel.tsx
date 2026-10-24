import { useApp, useActiveSlot } from '../state/context'
import type { Format } from '../types'
import { RotateCw, FlipHorizontal, Maximize2, Scissors } from 'lucide-react'

/* REMOVE BEFORE SUBMISSION */
export default function DevTargetsPanel() {
  const { state, dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const targets = activeSlot.targets || {}
  const settings = state.settings

  const handleTargetNumberChange = (key: 'widthPx' | 'heightPx' | 'minKb' | 'maxKb', val: string) => {
    const num = val.trim() === '' ? undefined : Number(val)
    dispatch({
      type: 'SET_TARGETS',
      slotId: activeSlot.id,
      targets: { [key]: isNaN(num as number) ? undefined : num },
    })
  }

  const handleFormatChange = (val: string) => {
    dispatch({
      type: 'SET_TARGETS',
      slotId: activeSlot.id,
      targets: { format: val === '' ? undefined : (val as Format) },
    })
  }

  const handleKbBaseToggle = (base: 1024 | 1000) => {
    dispatch({
      type: 'SET_SETTINGS',
      settings: { kbBase: base },
    })
  }

  const applyPresetTarget = (w?: number, h?: number, maxKb?: number, fmt?: Format) => {
    dispatch({
      type: 'SET_TARGETS',
      slotId: activeSlot.id,
      targets: {
        widthPx: w,
        heightPx: h,
        maxKb: maxKb,
        format: fmt,
      },
    })
  }

  return (
    <div
      className="rounded-xl p-3 shrink-0 flex flex-col gap-3"
      style={{
        background: '#FFFBEB',
        border: '1.5px solid #FCD34D',
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
          🧪 Dev Target & Pipeline Panel (?dev=1)
        </span>
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
          REMOVE BEFORE SUBMISSION
        </span>
      </div>

      {/* Target Inputs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {/* Width px */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-amber-900">Width (px)</label>
          <input
            type="number"
            id="dev-target-width"
            placeholder="e.g. 200"
            value={targets.widthPx ?? ''}
            onChange={e => handleTargetNumberChange('widthPx', e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Height px */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-amber-900">Height (px)</label>
          <input
            type="number"
            id="dev-target-height"
            placeholder="e.g. 230"
            value={targets.heightPx ?? ''}
            onChange={e => handleTargetNumberChange('heightPx', e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Min KB */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-amber-900">Min KB</label>
          <input
            type="number"
            id="dev-target-minkb"
            placeholder="e.g. 20"
            value={targets.minKb ?? ''}
            onChange={e => handleTargetNumberChange('minKb', e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Max KB */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-amber-900">Max KB</label>
          <input
            type="number"
            id="dev-target-maxkb"
            placeholder="e.g. 50"
            value={targets.maxKb ?? ''}
            onChange={e => handleTargetNumberChange('maxKb', e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Format Select */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-amber-900">Format</label>
          <select
            id="dev-target-format"
            value={targets.format ?? ''}
            onChange={e => handleFormatChange(e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">Default (JPG)</option>
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
          </select>
        </div>

        {/* KB Base Toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-amber-900">KB Base</label>
          <div className="flex rounded border border-amber-300 overflow-hidden text-xs">
            <button
              id="dev-kb-1024"
              className={`flex-1 py-1 font-medium ${
                settings.kbBase === 1024 ? 'bg-amber-600 text-white' : 'bg-white text-amber-900'
              }`}
              onClick={() => handleKbBaseToggle(1024)}
            >
              1024
            </button>
            <button
              id="dev-kb-1000"
              className={`flex-1 py-1 font-medium ${
                settings.kbBase === 1000 ? 'bg-amber-600 text-white' : 'bg-white text-amber-900'
              }`}
              onClick={() => handleKbBaseToggle(1000)}
            >
              1000
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets & Manual Ops Row */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-amber-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-amber-900 font-semibold">Quick Targets:</span>
          <button
            className="text-[11px] px-2 py-0.5 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-medium"
            onClick={() => applyPresetTarget(200, 230, 50, 'jpeg')}
          >
            200×230 ≤50KB JPG
          </button>
          <button
            className="text-[11px] px-2 py-0.5 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-medium"
            onClick={() => applyPresetTarget(300, 400, 100, 'jpeg')}
          >
            300×400 ≤100KB JPG
          </button>
          <button
            className="text-[11px] px-2 py-0.5 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-medium"
            onClick={() => applyPresetTarget(undefined, undefined, 3, 'jpeg')}
          >
            Max 3 KB (Impossible)
          </button>
          <button
            className="text-[11px] px-2 py-0.5 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-900 font-medium"
            onClick={() => applyPresetTarget(undefined, undefined, 50, 'png')}
          >
            PNG with 50KB limit
          </button>
          <button
            className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-gray-700 border border-amber-300"
            onClick={() =>
              dispatch({
                type: 'SET_TARGETS',
                slotId: activeSlot.id,
                targets: { widthPx: undefined, heightPx: undefined, minKb: undefined, maxKb: undefined, format: undefined },
              })
            }
          >
            Clear targets
          </button>
        </div>

        {/* Manual Ops Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="dev-btn-rotate-90"
            className="btn-secondary text-[11px] py-0.5 px-2 flex items-center gap-1 bg-white"
            onClick={() =>
              dispatch({
                type: 'APPLY_OPS',
                ops: [{ kind: 'rotate', degrees: 90 }],
                label: 'Rotated 90 degrees',
              })
            }
          >
            <RotateCw size={11} /> 90°
          </button>
          <button
            id="dev-btn-flip-h"
            className="btn-secondary text-[11px] py-0.5 px-2 flex items-center gap-1 bg-white"
            onClick={() =>
              dispatch({
                type: 'APPLY_OPS',
                ops: [{ kind: 'flip', axis: 'h' }],
                label: 'Flipped horizontal',
              })
            }
          >
            <FlipHorizontal size={11} /> Flip H
          </button>
          <button
            id="dev-btn-resize"
            className="btn-secondary text-[11px] py-0.5 px-2 flex items-center gap-1 bg-white"
            onClick={() =>
              dispatch({
                type: 'APPLY_OPS',
                ops: [{ kind: 'resize_px', width: 200, height: 230 }],
                label: 'Resized to 200×230 px',
              })
            }
          >
            <Maximize2 size={11} /> 200×230
          </button>
          <button
            id="dev-btn-crop"
            className="btn-secondary text-[11px] py-0.5 px-2 flex items-center gap-1 bg-white"
            onClick={() =>
              dispatch({
                type: 'APPLY_OPS',
                ops: [{ kind: 'crop', aspect: 200 / 230 }],
                label: 'Center-cropped to 200:230',
              })
            }
          >
            <Scissors size={11} /> Crop 200:230
          </button>
        </div>
      </div>
    </div>
  )
}
