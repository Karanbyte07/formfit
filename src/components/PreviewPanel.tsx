import { useRef, useEffect, useState, type DragEvent, type ChangeEvent } from 'react'
import { ImageIcon, Sparkles, UploadCloud } from 'lucide-react'
import { useApp, useActiveSlot } from '../state/context'
import { useImageLoader } from '../lib/image/useImageLoader'
import { usePipelineRunner } from '../lib/image/usePipelineRunner'
import CompareSlider from './CompareSlider'
import DevTargetsPanel from './DevTargetsPanel'

export default function PreviewPanel() {
  const { state, dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const { loadFile, loadSample } = useImageLoader()

  // Run pipeline, encoder, and verification asynchronously with debouncing
  usePipelineRunner()

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for ?dev=1 query param
  const [isDev, setIsDev] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setIsDev(params.get('dev') === '1')
    }
  }, [])

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

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      loadFile(file)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      loadFile(file)
    }
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
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,.heic,.heif"
        onChange={handleFileChange}
      />

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

          <p className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
            Drop your {activeSlot.id} here
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            JPG, PNG or WebP · up to 20 MB
          </p>

          <div
            className="flex gap-3 flex-wrap justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button id="btn-browse" className="btn-primary" onClick={triggerBrowse}>
              <UploadCloud size={16} /> Browse file
            </button>
            <button id="btn-try-sample" className="btn-secondary" onClick={loadSample}>
              <Sparkles size={16} style={{ color: 'var(--color-accent)' }} /> Try sample
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

      {/* ── REMOVE BEFORE SUBMISSION: ?dev=1 Temporary Target & Dev Panel ── */}
      {isDev && (
        <DevTargetsPanel />
      )}
    </div>
  )
}
