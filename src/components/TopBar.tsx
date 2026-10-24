import { useRef, type ChangeEvent } from 'react'
import type { SlotId } from '../types'
import { useApp, useActiveSlot } from '../state/context'
import { useImageLoader } from '../lib/image/useImageLoader'
import { formatBytes } from '../state/reducer'
import { RotateCcw, Undo2, Redo2, Download, Upload } from 'lucide-react'

const tabs: { id: SlotId; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'signature', label: 'Signature' },
  { id: 'thumb', label: 'Thumb' },
]

export default function TopBar() {
  const { state, dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const { loadFile } = useImageLoader()
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const hasFile = Boolean(activeSlot.original && activeSlot.fileName)
  const canUndo = activeSlot.history.length > 0
  const canRedo = Boolean(activeSlot.redoStack && activeSlot.redoStack.length > 0)
  const canReset = Boolean(activeSlot.original && activeSlot.ops.length > 0)

  const handleUploadClick = () => {
    uploadInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      loadFile(file)
    }
    e.target.value = ''
  }

  const handleDownload = () => {
    const blob = activeSlot.result?.blob
    if (!blob) {
      dispatch({
        type: 'LOG_MESSAGE',
        message: 'No processed image available to download.',
        logType: 'warn',
      })
      return
    }

    try {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = activeSlot.result?.format === 'png' ? 'png' : 'jpg'
      const w = activeSlot.result?.measured?.width || activeSlot.result?.width || 200
      const h = activeSlot.result?.measured?.height || activeSlot.result?.height || 230
      a.download = `formfit-${activeSlot.id}-${w}x${h}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      dispatch({
        type: 'LOG_MESSAGE',
        message: `Downloaded ${a.download} (${formatBytes(blob.size)})`,
        logType: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      dispatch({
        type: 'LOG_MESSAGE',
        message: `Download failed: ${msg}`,
        logType: 'error',
      })
    }
  }

  return (
    <header
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="flex items-center gap-3 px-4 py-2 flex-wrap"
    >
      <input
        ref={uploadInputRef}
        type="file"
        id="topbar-file-input"
        className="hidden"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,.heic,.heif"
        onChange={handleFileChange}
      />

      {/* Logo + brand */}
      <div className="flex items-center gap-2 mr-2 flex-shrink-0">
        <LogoMark />
        <span
          style={{ color: 'var(--color-text)' }}
          className="text-base font-bold tracking-tight"
        >
          FormFit
        </span>
      </div>

      {/* Tab switcher */}
      <nav
        className="flex items-center gap-1 rounded-lg p-1 flex-shrink-0"
        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
        aria-label="Image type tabs"
      >
        {tabs.map(tab => {
          const isSlotActive = state.activeSlot === tab.id
          const slotHasImage = Boolean(state.slots[tab.id].original)

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_SLOT', slotId: tab.id })}
              aria-selected={isSlotActive}
              className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
              style={
                isSlotActive
                  ? {
                      background: 'var(--color-accent)',
                      color: '#fff',
                      boxShadow: 'var(--shadow-sm)',
                    }
                  : {
                      color: 'var(--color-muted)',
                    }
              }
            >
              <span>{tab.label}</span>
              {slotHasImage && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isSlotActive ? '#fff' : 'var(--color-accent)',
                  }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* File badge — hidden when no file is loaded */}
      {hasFile && activeSlot.fileName && (
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium flex-shrink-0"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          <span style={{ color: 'var(--color-text)' }} className="font-semibold max-w-[150px] truncate">
            {activeSlot.fileName}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-mono"
            style={{
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
            }}
          >
            {formatBytes(activeSlot.fileSize || 0)}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          id="btn-upload"
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
          onClick={handleUploadClick}
        >
          <Upload size={14} /> Upload
        </button>

        <button
          id="btn-undo"
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!canUndo}
          onClick={() => dispatch({ type: 'UNDO' })}
          title="Undo last change"
        >
          <Undo2 size={14} /> Undo
        </button>

        <button
          id="btn-redo"
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!canRedo}
          onClick={() => dispatch({ type: 'REDO' })}
          title="Redo change"
        >
          <Redo2 size={14} /> Redo
        </button>

        <button
          id="btn-reset"
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!canReset}
          onClick={() => dispatch({ type: 'RESET' })}
          title="Reset to original image"
        >
          <RotateCcw size={14} /> Reset
        </button>

        <button
          id="btn-download"
          className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!activeSlot.result?.blob}
          onClick={handleDownload}
        >
          <Download size={14} /> Download
        </button>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0F766E" />
      <rect x="8" y="8" width="10" height="14" rx="2" fill="white" opacity="0.85" />
      <rect x="14" y="12" width="10" height="12" rx="2" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.5" />
      <circle cx="19" cy="17" r="2.5" fill="#0F766E" />
      <line x1="17" y1="21.5" x2="21" y2="21.5" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
