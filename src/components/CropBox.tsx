/**
 * CropBox.tsx — Aspect-locked manual crop tool (spec § 4.2 S5)
 *
 * Interactive draggable and resizable crop box overlaid on the image preview.
 * Supports aspect-locking to target dimensions (or free-form crop).
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X, Lock, Unlock } from 'lucide-react'

interface CropRect {
  x: number // percentage 0..100
  y: number // percentage 0..100
  w: number // percentage 0..100
  h: number // percentage 0..100
}

interface CropBoxProps {
  imageBitmap: ImageBitmap
  targetAspect?: number // e.g. targetWidth / targetHeight
  onApplyCrop: (rect: { x: number; y: number; w: number; h: number }) => void
  onCancel: () => void
}

export default function CropBox({
  imageBitmap,
  targetAspect,
  onApplyCrop,
  onCancel,
}: CropBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [locked, setLocked] = useState<boolean>(Boolean(targetAspect && targetAspect > 0))

  // Initial crop box centered, ~75% size
  const [crop, setCrop] = useState<CropRect>(() => {
    const imgAspect = imageBitmap.width / imageBitmap.height
    const effectiveAspect = (targetAspect && targetAspect > 0) ? targetAspect : imgAspect

    let w = 70
    let h = (w / effectiveAspect) * imgAspect

    if (h > 85) {
      h = 85
      w = h * effectiveAspect / imgAspect
    }

    return {
      x: (100 - w) / 2,
      y: (100 - h) / 2,
      w: Math.max(10, Math.min(95, w)),
      h: Math.max(10, Math.min(95, h)),
    }
  })

  const [activeDrag, setActiveDrag] = useState<
    'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null
  >(null)
  const dragStart = useRef<{ clientX: number; clientY: number; crop: CropRect }>({
    clientX: 0,
    clientY: 0,
    crop,
  })

  const handlePointerDown = (
    e: React.PointerEvent,
    handle: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setActiveDrag(handle)
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      crop: { ...crop },
    }
  }

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeDrag || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const dxPct = ((e.clientX - dragStart.current.clientX) / rect.width) * 100
      const dyPct = ((e.clientY - dragStart.current.clientY) / rect.height) * 100
      const init = dragStart.current.crop

      let nextX = init.x
      let nextY = init.y
      let nextW = init.w
      let nextH = init.h

      if (activeDrag === 'move') {
        nextX = Math.max(0, Math.min(100 - init.w, init.x + dxPct))
        nextY = Math.max(0, Math.min(100 - init.h, init.y + dyPct))
      } else {
        const imgAspect = imageBitmap.width / imageBitmap.height
        const aspect = (locked && targetAspect && targetAspect > 0) ? targetAspect : null

        if (activeDrag.includes('e')) {
          nextW = Math.max(10, Math.min(100 - init.x, init.w + dxPct))
        }
        if (activeDrag.includes('s')) {
          nextH = Math.max(10, Math.min(100 - init.y, init.h + dyPct))
        }
        if (activeDrag.includes('w')) {
          const maxLeft = init.x + init.w - 10
          nextX = Math.max(0, Math.min(maxLeft, init.x + dxPct))
          nextW = init.w - (nextX - init.x)
        }
        if (activeDrag.includes('n')) {
          const maxTop = init.y + init.h - 10
          nextY = Math.max(0, Math.min(maxTop, init.y + dyPct))
          nextH = init.h - (nextY - init.y)
        }

        // Apply aspect ratio lock if active
        if (aspect) {
          if (activeDrag === 'e' || activeDrag === 'w') {
            nextH = (nextW / aspect) * imgAspect
          } else {
            nextW = (nextH * aspect) / imgAspect
          }
          if (nextX + nextW > 100) nextW = 100 - nextX
          if (nextY + nextH > 100) nextH = 100 - nextY
        }
      }

      setCrop({
        x: Math.max(0, Math.min(90, nextX)),
        y: Math.max(0, Math.min(90, nextY)),
        w: Math.max(10, Math.min(100 - nextX, nextW)),
        h: Math.max(10, Math.min(100 - nextY, nextH)),
      })
    },
    [activeDrag, imageBitmap, locked, targetAspect]
  )

  const handlePointerUp = useCallback(() => {
    setActiveDrag(null)
  }, [])

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [activeDrag, handlePointerMove, handlePointerUp])

  const handleApply = () => {
    // Map crop percentage 0..100 to original image pixel coordinates
    const pixelRect = {
      x: Math.round((crop.x / 100) * imageBitmap.width),
      y: Math.round((crop.y / 100) * imageBitmap.height),
      w: Math.round((crop.w / 100) * imageBitmap.width),
      h: Math.round((crop.h / 100) * imageBitmap.height),
    }
    onApplyCrop(pixelRect)
  }

  // Draw bitmap preview inside canvas container
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = imageBitmap.width
    canvas.height = imageBitmap.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(imageBitmap, 0, 0)
    }
  }, [imageBitmap])

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden rounded-xl bg-black/80">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/60 text-white z-20 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Manual Crop</span>
          {targetAspect && (
            <button
              onClick={() => setLocked(!locked)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
              style={{
                background: locked ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
                color: '#fff',
              }}
              title={locked ? 'Ratio locked to target aspect' : 'Free ratio crop'}
            >
              {locked ? <Lock size={12} /> : <Unlock size={12} />}
              {locked ? `Locked (${targetAspect.toFixed(2)})` : 'Free'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={13} /> Cancel
          </button>
          <button
            id="btn-apply-crop"
            onClick={handleApply}
            className="flex items-center gap-1 px-3 py-1 rounded font-semibold text-white transition-colors shadow-sm"
            style={{ background: 'var(--color-accent)' }}
          >
            <Check size={13} /> Apply Crop
          </button>
        </div>
      </div>

      {/* Interactive area */}
      <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden">
        <div
          ref={containerRef}
          className="relative max-w-full max-h-full inline-block"
          style={{
            aspectRatio: `${imageBitmap.width} / ${imageBitmap.height}`,
          }}
        >
          {/* Base image canvas */}
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[70vh] object-contain block mx-auto rounded"
          />

          {/* Semi-transparent dark backdrop overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'rgba(0, 0, 0, 0.55)',
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% ${crop.y}%,
                ${crop.x}% ${crop.y}%,
                ${crop.x}% ${crop.y + crop.h}%,
                ${crop.x + crop.w}% ${crop.y + crop.h}%,
                ${crop.x + crop.w}% ${crop.y}%,
                0% ${crop.y}%
              )`,
            }}
          />

          {/* Interactive Crop Box */}
          <div
            className="absolute cursor-move border-2 border-white shadow-xl"
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.w}%`,
              height: `${crop.h}%`,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
            }}
            onPointerDown={e => handlePointerDown(e, 'move')}
          >
            {/* Rule of thirds grid lines */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-white/30" />
              <div className="border-r border-white/30" />
              <div />
            </div>

            {/* Corner Resize Handles */}
            <div
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-gray-600 rounded-sm cursor-nwse-resize shadow"
              onPointerDown={e => handlePointerDown(e, 'nw')}
            />
            <div
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-gray-600 rounded-sm cursor-nesw-resize shadow"
              onPointerDown={e => handlePointerDown(e, 'ne')}
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-gray-600 rounded-sm cursor-nesw-resize shadow"
              onPointerDown={e => handlePointerDown(e, 'sw')}
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-gray-600 rounded-sm cursor-nwse-resize shadow"
              onPointerDown={e => handlePointerDown(e, 'se')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
