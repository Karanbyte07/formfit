import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type PointerEvent } from 'react'
import { formatFileSize } from '../lib/units'
import { Loader2 } from 'lucide-react'

interface CompareSliderProps {
  originalBitmap?: ImageBitmap
  originalSize?: number
  processedCanvas?: HTMLCanvasElement
  processedBlob?: Blob | null
  newBytes?: number
  isProcessing?: boolean
  kbBase?: 1024 | 1000
}

export default function CompareSlider({
  originalBitmap,
  originalSize = 0,
  processedCanvas,
  processedBlob,
  newBytes = 0,
  isProcessing = false,
  kbBase = 1024,
}: CompareSliderProps) {
  const [sliderPos, setSliderPos] = useState(50) // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)

  // Convert original bitmap to object URL and revoke previous
  useEffect(() => {
    if (!originalBitmap) {
      setOriginalUrl(null)
      return
    }

    let revoked = false
    const canvas = document.createElement('canvas')
    canvas.width = originalBitmap.width
    canvas.height = originalBitmap.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(originalBitmap, 0, 0)
      canvas.toBlob(blob => {
        if (!blob || revoked) return
        const url = URL.createObjectURL(blob)
        setOriginalUrl(url)
      }, 'image/jpeg', 0.95)
    }

    return () => {
      revoked = true
      setOriginalUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [originalBitmap])

  // Convert processed blob/canvas to object URL and revoke previous
  useEffect(() => {
    let url: string | null = null

    if (processedBlob) {
      url = URL.createObjectURL(processedBlob)
      setProcessedUrl(url)
    } else if (processedCanvas) {
      let cancelled = false
      processedCanvas.toBlob(blob => {
        if (!blob || cancelled) return
        url = URL.createObjectURL(blob)
        setProcessedUrl(url)
      }, 'image/jpeg', 0.95)

      return () => {
        cancelled = true
        if (url) URL.revokeObjectURL(url)
      }
    } else {
      setProcessedUrl(null)
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [processedBlob, processedCanvas])

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPos(Number(percent.toFixed(1)))
  }, [])

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updatePosition(e.clientX)
    }
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setSliderPos(p => Math.max(0, p - 5))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setSliderPos(p => Math.min(100, p + 5))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setSliderPos(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setSliderPos(100)
    }
  }

  const origFormatted = formatFileSize(originalSize, kbBase)
  const newFormatted = newBytes > 0 ? formatFileSize(newBytes, kbBase) : undefined

  return (
    <div className="flex flex-col gap-2 w-full h-full min-h-0">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Before / After</span>
          {newFormatted && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {origFormatted} → {newFormatted}
            </span>
          )}
        </div>

        {isProcessing && (
          <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium">
            <Loader2 size={13} className="animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Slider Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[300px] rounded-xl overflow-hidden border border-[var(--color-border)] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] cursor-ew-resize select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        tabIndex={0}
        role="slider"
        aria-valuenow={sliderPos}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before/After comparison slider. Use left and right arrow keys to adjust."
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Layer 1: Processed (Right / Background Layer) */}
        {processedUrl ? (
          <img
            src={processedUrl}
            alt="Processed result"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        ) : originalUrl ? (
          <img
            src={originalUrl}
            alt="Original fallback"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
          />
        ) : null}

        {/* Layer 2: Original (Left / Clipped Top Layer) */}
        {originalUrl && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={originalUrl}
              alt="Original upload"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                maxWidth: 'none',
              }}
            />
          </div>
        )}

        {/* Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Handle knob */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-md border-2 border-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent)] text-xs font-bold">
            ◂▸
          </div>
        </div>

        {/* Labels */}
        <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[11px] font-semibold bg-black/60 text-white backdrop-blur-sm pointer-events-none">
          Original
        </span>
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[11px] font-semibold bg-black/60 text-white backdrop-blur-sm pointer-events-none">
          Processed
        </span>
      </div>
    </div>
  )
}
