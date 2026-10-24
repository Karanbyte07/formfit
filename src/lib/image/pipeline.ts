import type { Intent } from '../../types'
import {
  rotateCanvas,
  flipCanvas,
  cropCanvas,
  centerCropToAspect,
  resizeTo,
} from './ops'

export interface PipelineResult {
  canvas: HTMLCanvasElement
  width: number
  height: number
}

function createInitialCanvas(source: ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(source, 0, 0)
  }
  return canvas
}

/**
 * Applies operations non-destructively in canonical order:
 * 1. Orientation (Rotate, Flip)
 * 2. Crop (Rect or Aspect)
 * 3. Resize (Pixels or cm)
 * 4. Color (Stubbed for future steps)
 * 5. Overlays
 */
export function applyPipeline(original: ImageBitmap, ops: Intent[]): PipelineResult {
  if (!original) {
    const canvas = document.createElement('canvas')
    canvas.width = 0
    canvas.height = 0
    return { canvas, width: 0, height: 0 }
  }

  // Start with a clean copy of the original
  let current: HTMLCanvasElement = createInitialCanvas(original)

  if (!ops || ops.length === 0) {
    return { canvas: current, width: current.width, height: current.height }
  }

  // ── Step 1: Orientation (Rotate & Flip) ───────────────────────────
  let netRotation = 0
  let flipH = false
  let flipV = false

  for (const op of ops) {
    if (op.kind === 'rotate') {
      netRotation = (netRotation + op.degrees) % 360
    } else if (op.kind === 'flip') {
      if (op.axis === 'h') flipH = !flipH
      if (op.axis === 'v') flipV = !flipV
    }
  }

  if (netRotation === 90 || netRotation === 180 || netRotation === 270) {
    current = rotateCanvas(current, netRotation as 90 | 180 | 270)
  }
  if (flipH) {
    current = flipCanvas(current, 'h')
  }
  if (flipV) {
    current = flipCanvas(current, 'v')
  }

  // ── Step 2: Crop ──────────────────────────────────────────────────
  // Latest crop intent takes precedence
  const lastCrop = [...ops].reverse().find(op => op.kind === 'crop')
  if (lastCrop && lastCrop.kind === 'crop') {
    if (lastCrop.rect) {
      current = cropCanvas(current, {
        x: lastCrop.rect.x,
        y: lastCrop.rect.y,
        width: lastCrop.rect.w,
        height: lastCrop.rect.h,
      })
    } else if (lastCrop.aspect) {
      current = centerCropToAspect(current, lastCrop.aspect)
    }
  }

  // ── Step 3: Resize ────────────────────────────────────────────────
  // Latest resize intent takes precedence
  const lastResize = [...ops].reverse().find(
    op => op.kind === 'resize_px' || op.kind === 'resize_cm'
  )
  if (lastResize) {
    if (lastResize.kind === 'resize_px') {
      current = resizeTo(current, lastResize.width, lastResize.height)
    } else if (lastResize.kind === 'resize_cm') {
      const dpi = lastResize.dpi || 300
      const targetW = Math.round((lastResize.widthCm / 2.54) * dpi)
      const targetH = Math.round((lastResize.heightCm / 2.54) * dpi)
      current = resizeTo(current, targetW, targetH)
    }
  }

  // ── Step 4: Color (Grayscale, Brightness, White BG) ───────────────
  // Stub for upcoming milestones per spec section 6.4
  // TODO: Implement grayscale, brightness, contrast, white_bg, signature_clean

  return {
    canvas: current,
    width: current.width,
    height: current.height,
  }
}
