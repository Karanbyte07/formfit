import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { ImageIcon, Sparkles, UploadCloud, X, CheckCircle2 } from 'lucide-react'
import { useApp, useActiveSlot } from '../state/context'
import { useImageLoader } from '../lib/image/useImageLoader'
import { usePipelineRunner } from '../lib/image/usePipelineRunner'
import CompareSlider from './CompareSlider'
import type { SlotId } from '../types'

export default function PreviewPanel() {
  const { state, dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const { loadFile, loadSample } = useImageLoader()

  // Run pipeline, encoder, and verification asynchronously with debouncing
  usePipelineRunner()

  const [isDragging, setIsDragging] = useState(false)
  const [multiDropBanner, setMultiDropBanner] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleFileList = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter(
      f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name)
    )
    if (files.length === 0) return

    if (files.length === 1) {
      loadFile(files[0], activeSlot.id)
      return
    }

    // Multi-file drop (Spec § 12): smart heuristic assignment
    const allSlots: SlotId[] = ['photo', 'signature', 'thumb']
    const assigned = new Map<SlotId, File>()
    const unassignedFiles: File[] = []

    for (const f of files) {
      const lower = f.name.toLowerCase()
      if (/sig|sign|hastakshar/i.test(lower) && !assigned.has('signature')) {
        assigned.set('signature', f)
      } else if (/thumb|angutha|impression/i.test(lower) && !assigned.has('thumb')) {
        assigned.set('thumb', f)
      } else if (/photo|pic|avatar|portrait/i.test(lower) && !assigned.has('photo')) {
        assigned.set('photo', f)
      } else {
        unassignedFiles.push(f)
      }
    }

    // Fill activeSlot first if not assigned, then remaining slots
    if (!assigned.has(activeSlot.id) && unassignedFiles.length > 0) {
      assigned.set(activeSlot.id, unassignedFiles.shift()!)
    }
    for (const s of allSlots) {
      if (!assigned.has(s) && unassignedFiles.length > 0) {
        assigned.set(s, unassignedFiles.shift()!)
      }
    }

    const assignmentsSummary: string[] = []
    for (const [slotId, f] of assigned.entries()) {
      loadFile(f, slotId)
      assignmentsSummary.push(`${f.name} → ${slotId.toUpperCase()}`)
    }

    const bannerMsg = `Assigned ${assigned.size} files: ${assignmentsSummary.join(' · ')}`
    setMultiDropBanner(bannerMsg)
    dispatch({
      type: 'LOG_MESSAGE',
      message: `Multi-file drop: ${bannerMsg}`,
      logType: 'success',
    })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileList(e.dataTransfer.files)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileList(e.target.files)
    e.target.value = ''
  }

  const triggerBrowse = () => {
    fileInputRef.current?.click()
  }

  const isLoaded = Boolean(activeSlot.original)

  return (
    <div
      className="flex-1 flex flex-col min-h-0 p-4 gap-3 h-full"
      style={{ background: 'var(--color-bg)' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        id="preview-file-input"
        className="hidden"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,.heic,.heif"
        onChange={handleFileChange}
      />

      {/* Multi-file drop notification banner */}
      {multiDropBanner && (
        <div
          className="flex items-center justify-between p-2.5 rounded-xl text-xs shrink-0 animate-in fade-in"
          style={{
            background: 'var(--color-accent-soft)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-accent)',
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span className="font-medium">{multiDropBanner}</span>
          </div>
          <button
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
            onClick={() => setMultiDropBanner(null)}
            aria-label="Dismiss banner"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Empty State: Drop Zone ─────────────────────────────────── */}
      {!isLoaded && (
        <div
          id="drop-zone"
          className="flex-1 flex flex-col items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer group min-h-[380px] p-6 text-center"
          style={{
            border: isDragging ? '2px dashed var(--color-accent)' : '2px dashed var(--color-border)',
            background: isDragging ? 'var(--color-accent-soft)' : 'var(--color-surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onClick={triggerBrowse}
          role="button"
          aria-label="Drop zone for photo or signature upload"
          tabIndex={0}
        >
          {/* Decorative icon cluster */}
          <div className="relative mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ background: 'var(--color-accent-soft)', border: '1.5px solid var(--color-border)' }}
            >
              <ImageIcon size={36} style={{ color: 'var(--color-accent)' }} />
            </div>
            <span
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              <Sparkles size={14} />
            </span>
          </div>

          <p className="text-lg font-semibold mb-1 capitalize" style={{ color: 'var(--color-text)' }}>
            Drop your {activeSlot.id} here
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            JPG, PNG or WebP · Drop 1, 2, or 3 files to assign across slots
          </p>

          <div
            className="flex gap-3 flex-wrap justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button id="btn-browse" className="btn-primary" onClick={triggerBrowse}>
              <UploadCloud size={16} /> Browse file
            </button>
            <button
              id="btn-try-sample"
              className="btn-secondary"
              onClick={() => loadSample(activeSlot.id)}
            >
              <Sparkles size={16} style={{ color: 'var(--color-accent)' }} /> Try sample {activeSlot.id}
            </button>
          </div>
        </div>
      )}

      {/* ── Loaded State: Before / After Slider ─────────────────────── */}
      {isLoaded && (
        <div className="flex-1 flex flex-col min-h-0 gap-3">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                {activeSlot.id} preview
              </span>
              <span className="text-xs font-medium text-gray-500">
                {activeSlot.fileName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary text-xs py-1 px-3"
                onClick={triggerBrowse}
              >
                Change file
              </button>
              <button
                className="btn-secondary text-xs py-1 px-3 text-red-700 hover:text-red-800"
                onClick={() => dispatch({ type: 'CLEAR_SLOT' })}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Before/After Comparison Slider */}
          <div className="flex-1 min-h-[320px] flex flex-col">
            <CompareSlider
              originalBitmap={activeSlot.original}
              originalSize={activeSlot.fileSize}
              processedCanvas={activeSlot.result?.canvas}
              processedBlob={activeSlot.result?.blob}
              newBytes={activeSlot.result?.measured?.bytes || activeSlot.result?.blob?.size || 0}
              isProcessing={activeSlot.isProcessing}
              kbBase={state.settings.kbBase}
            />
          </div>
        </div>
      )}
    </div>
  )
}
