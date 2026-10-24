import { useRef, useEffect, useState, type DragEvent, type ChangeEvent } from 'react'
import { ImageIcon, Sparkles, UploadCloud, RotateCw, FlipHorizontal, Scissors, Maximize2 } from 'lucide-react'
import { useApp, useActiveSlot } from '../state/context'
import { useImageLoader } from '../lib/image/useImageLoader'
import { formatBytes } from '../state/reducer'

export default function PreviewPanel() {
  const { dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const { loadFile, loadSample } = useImageLoader()

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const processedCanvasRef = useRef<HTMLCanvasElement>(null)

  // Check for ?dev=1 query param
  const [isDev, setIsDev] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setIsDev(params.get('dev') === '1')
    }
  }, [])

  // Render original canvas
  useEffect(() => {
    const canvas = originalCanvasRef.current
    if (!canvas || !activeSlot.original) return

    canvas.width = activeSlot.original.width
    canvas.height = activeSlot.original.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(activeSlot.original, 0, 0)
    }
  }, [activeSlot.original])

  // Render processed canvas
  useEffect(() => {
    const targetCanvas = processedCanvasRef.current
    const sourceCanvas = activeSlot.result?.canvas
    if (!targetCanvas || !sourceCanvas) return

    targetCanvas.width = sourceCanvas.width
    targetCanvas.height = sourceCanvas.height
    const ctx = targetCanvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
      ctx.drawImage(sourceCanvas, 0, 0)
    }
  }, [activeSlot.result])

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
    // reset input so the same file can be selected again
    e.target.value = ''
  }

  const triggerBrowse = () => {
    fileInputRef.current?.click()
  }

  const isLoaded = Boolean(activeSlot.original)

  return (
    <div
      className="flex-1 flex flex-col min-h-0 p-4 gap-4"
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

      {/* ── Loaded State: Side-by-side Before/After ─────────────────── */}
      {isLoaded && (
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                {activeSlot.id} preview
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
                {activeSlot.fileName} · {formatBytes(activeSlot.fileSize || 0)}
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

          {/* Two-panel side-by-side view */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: Original */}
            <div
              className="flex flex-col rounded-xl overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="px-3 py-2 text-xs font-semibold flex items-center justify-between"
                style={{
                  background: 'var(--color-bg)',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-muted)',
                }}
              >
                <span>Original</span>
                <span className="font-mono text-[11px]">
                  {activeSlot.originalWidth} × {activeSlot.originalHeight} px
                </span>
              </div>
              <div className="flex-1 min-h-[260px] p-4 flex items-center justify-center overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <canvas
                  ref={originalCanvasRef}
                  className="max-h-full max-w-full object-contain rounded shadow-sm"
                  style={{ maxHeight: '420px' }}
                />
              </div>
            </div>

            {/* Right: Processed Result */}
            <div
              className="flex flex-col rounded-xl overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="px-3 py-2 text-xs font-semibold flex items-center justify-between"
                style={{
                  background: 'var(--color-bg)',
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-accent)',
                }}
              >
                <span>Processed Result</span>
                <span className="font-mono text-[11px] font-bold">
                  {activeSlot.result?.width || activeSlot.originalWidth} ×{' '}
                  {activeSlot.result?.height || activeSlot.originalHeight} px
                </span>
              </div>
              <div className="flex-1 min-h-[260px] p-4 flex items-center justify-center overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                <canvas
                  ref={processedCanvasRef}
                  className="max-h-full max-w-full object-contain rounded shadow-sm"
                  style={{ maxHeight: '420px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE BEFORE SUBMISSION: ?dev=1 Temporary Test Buttons ── */}
      {isDev && isLoaded && (
        <div
          className="rounded-xl p-3 shrink-0"
          style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              🧪 Pipeline Dev Test Buttons (?dev=1)
            </span>
            <span className="text-[11px] text-amber-700">REMOVE BEFORE SUBMISSION</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="dev-btn-rotate-90"
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 bg-white"
              onClick={() =>
                dispatch({
                  type: 'APPLY_OPS',
                  ops: [{ kind: 'rotate', degrees: 90 }],
                  label: 'Rotated 90 degrees',
                })
              }
            >
              <RotateCw size={12} /> Rotate 90
            </button>
            <button
              id="dev-btn-flip-h"
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 bg-white"
              onClick={() =>
                dispatch({
                  type: 'APPLY_OPS',
                  ops: [{ kind: 'flip', axis: 'h' }],
                  label: 'Flipped horizontal',
                })
              }
            >
              <FlipHorizontal size={12} /> Flip horizontal
            </button>
            <button
              id="dev-btn-resize"
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 bg-white"
              onClick={() =>
                dispatch({
                  type: 'APPLY_OPS',
                  ops: [{ kind: 'resize_px', width: 200, height: 230 }],
                  label: 'Resized to 200×230 px',
                })
              }
            >
              <Maximize2 size={12} /> Resize 200×230
            </button>
            <button
              id="dev-btn-crop"
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 bg-white"
              onClick={() =>
                dispatch({
                  type: 'APPLY_OPS',
                  ops: [{ kind: 'crop', aspect: 200 / 230 }],
                  label: 'Center-cropped to 200:230 aspect ratio',
                })
              }
            >
              <Scissors size={12} /> Center-crop to 200:230
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
