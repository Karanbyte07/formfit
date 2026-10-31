import { useState, useRef, type ChangeEvent } from 'react'
import type { SlotId } from '../types'
import { useApp, useActiveSlot } from '../state/context'
import { useImageLoader } from '../lib/image/useImageLoader'
import { formatBytes } from '../state/reducer'
import {
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  Upload,
  FileText,
  Archive,
  Check,
  AlertTriangle,
  Loader2,
  Target,
} from 'lucide-react'
import NoticeDialog from './NoticeDialog'
import { createSlotsZip, triggerDownload } from '../lib/zip'

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
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [isZipping, setIsZipping] = useState(false)

  const hasFile = Boolean(activeSlot.original && activeSlot.fileName)
  const canUndo = activeSlot.history.length > 0
  const canRedo = Boolean(activeSlot.redoStack && activeSlot.redoStack.length > 0)
  const canReset = Boolean(activeSlot.original && activeSlot.ops.length > 0)

  // Count slots with ready blobs for ZIP bundle
  const readySlots = Object.values(state.slots).filter(s => Boolean(s.result?.blob))
  const canDownloadZip = readySlots.length >= 2

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
      const ext = activeSlot.result?.format === 'png' ? 'png' : 'jpg'
      const w = activeSlot.result?.measured?.width || activeSlot.result?.width || 200
      const h = activeSlot.result?.measured?.height || activeSlot.result?.height || 230
      const filename = `formfit-${activeSlot.id}-${w}x${h}.${ext}`

      triggerDownload(blob, filename)

      dispatch({
        type: 'LOG_MESSAGE',
        message: `Downloaded ${filename} (${formatBytes(blob.size)})`,
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

  const handleDownloadZip = async () => {
    if (!canDownloadZip || isZipping) return
    setIsZipping(true)
    dispatch({
      type: 'LOG_MESSAGE',
      message: `Packaging ${readySlots.length} slots into ZIP...`,
      logType: 'info',
    })

    try {
      const zipBlob = await createSlotsZip(state.slots)
      triggerDownload(zipBlob, 'formfit-application-pack.zip')
      dispatch({
        type: 'LOG_MESSAGE',
        message: `Downloaded formfit-application-pack.zip (${formatBytes(zipBlob.size)}) with ${readySlots.length} ready files.`,
        logType: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      dispatch({
        type: 'LOG_MESSAGE',
        message: `ZIP creation failed: ${msg}`,
        logType: 'error',
      })
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <>
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

        {/* Tab switcher with smart status badges */}
        <nav
          className="flex items-center gap-1 rounded-lg p-1 flex-shrink-0"
          style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
          aria-label="Image type tabs"
        >
          {tabs.map(tab => {
            const isSlotActive = state.activeSlot === tab.id
            const slot = state.slots[tab.id]
            const hasImage = Boolean(slot.original)
            const hasRules = slot.ops.length > 0 || Boolean(slot.targets.widthPx || slot.targets.maxKb)
            const isPassing = hasImage && slot.result?.status === 'met'
            const isProcessing = slot.isProcessing
            const measuredKb = slot.result?.kb

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_SLOT', slotId: tab.id })
                  document.getElementById('command-input')?.focus()
                }}
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

                {/* Status Badges */}
                {isProcessing && (
                  <Loader2 size={11} className="animate-spin text-teal-300" />
                )}

                {!isProcessing && isPassing && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-semibold rounded-full"
                    style={{
                      background: isSlotActive ? 'rgba(255,255,255,0.25)' : '#DCFCE7',
                      color: isSlotActive ? '#fff' : '#15803D',
                    }}
                    title={`Compliance passed: ${measuredKb ? measuredKb + ' KB' : 'OK'}`}
                  >
                    <Check size={9} />
                    {measuredKb ? `${measuredKb} KB` : '✓'}
                  </span>
                )}

                {!isProcessing && hasImage && !isPassing && (
                  <span
                    className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-black rounded-full"
                    style={{
                      background: isSlotActive ? '#FEF08A' : '#FEF3C7',
                      color: '#854D0E',
                    }}
                    title="Targets not met"
                  >
                    <AlertTriangle size={9} />
                  </span>
                )}

                {!hasImage && hasRules && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] rounded-full"
                    style={{
                      background: isSlotActive ? 'rgba(255,255,255,0.2)' : 'var(--color-surface)',
                      border: isSlotActive ? 'none' : '1px solid var(--color-border)',
                      color: isSlotActive ? '#fff' : 'var(--color-accent)',
                    }}
                    title="Rules ready — drop file to apply"
                  >
                    <Target size={9} /> Ready
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* "Paste form notice" button */}
        <button
          id="btn-paste-notice"
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg flex-shrink-0 font-medium"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          onClick={() => setNoticeOpen(true)}
          title="Paste exam/job notification text to extract rules automatically"
        >
          <FileText size={14} style={{ color: 'var(--color-accent)' }} />
          <span>Paste form notice</span>
        </button>

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

          {/* Single slot download */}
          <button
            id="btn-download"
            className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!activeSlot.result?.blob}
            onClick={handleDownload}
          >
            <Download size={14} /> Download
          </button>

          {/* Multi-slot ZIP download bundle (active when 2+ slots ready) */}
          {canDownloadZip && (
            <button
              id="btn-download-all"
              className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5 shadow-md animate-in fade-in"
              style={{
                background: '#047857', // Emerald green distinction
              }}
              onClick={handleDownloadZip}
              disabled={isZipping}
              title={`Download ZIP of ${readySlots.length} ready application files`}
            >
              {isZipping ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Zipping…
                </>
              ) : (
                <>
                  <Archive size={14} /> Download All (ZIP)
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Paste Notice Modal */}
      <NoticeDialog open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </>
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
