import type { Intent, Targets } from '../../types'
import { cmToPx } from '../units'
import {
  rotateCanvas,
  flipCanvas,
  cropCanvas,
  centerCropToAspect,
  resizeTo,
  applyWhiteBackground,
  applyGrayscale,
  applyBrightness,
  applyContrast,
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
 * Applies operations non-destructively in canonical order (spec § 6.4):
 * 1. Orientation (Rotate, Flip)
 * 2. Crop (manual crop or auto center-crop to target aspect)
 * 3. Resize (explicit resize op or target widthPx/heightPx)
 * 4. Color (white_bg, grayscale, brightness, contrast)
 * 5. Overlays (stub — S6)
 */
export function applyPipeline(
  original: ImageBitmap,
  ops: Intent[],
  targets?: Targets,
  settings?: { dpi?: number }
): PipelineResult {
  if (!original) {
    const canvas = document.createElement('canvas')
    canvas.width = 0
    canvas.height = 0
    return { canvas, width: 0, height: 0 }
  }

  const dpi = settings?.dpi ?? 300

  // Start with a clean copy of the original
  let current: HTMLCanvasElement = createInitialCanvas(original)

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
  } else if (targets?.widthPx && targets?.heightPx && targets.widthPx > 0 && targets.heightPx > 0) {
    const targetAspect = targets.widthPx / targets.heightPx
    current = centerCropToAspect(current, targetAspect)
  }

  // ── Step 3: Resize ────────────────────────────────────────────────
  const lastResize = [...ops].reverse().find(
    op => op.kind === 'resize_px' || op.kind === 'resize_cm'
  )
  if (lastResize) {
    if (lastResize.kind === 'resize_px') {
      current = resizeTo(current, lastResize.width, lastResize.height)
    } else if (lastResize.kind === 'resize_cm') {
      const effectiveDpi = lastResize.dpi || dpi
      const targetW = cmToPx(lastResize.widthCm, effectiveDpi)
      const targetH = cmToPx(lastResize.heightCm, effectiveDpi)
      current = resizeTo(current, targetW, targetH)
    }
  } else if (targets?.widthPx && targets?.heightPx && targets.widthPx > 0 && targets.heightPx > 0) {
    current = resizeTo(current, targets.widthPx, targets.heightPx)
  }

  // ── Step 4: Color ops (spec § 6.4 order: white_bg, grayscale, brightness, contrast) ──
  // white_bg — check if chip exists
  const hasWhiteBg = ops.some(op => op.kind === 'white_bg')
  if (hasWhiteBg) {
    current = applyWhiteBackground(current)
  }

  // grayscale
  const hasGrayscale = ops.some(op => op.kind === 'grayscale')
  if (hasGrayscale) {
    current = applyGrayscale(current)
  }

  // brightness — accumulate all deltas (spec: additive/transform intents update or combine cleanly)
  const totalBrightness = ops.reduce((sum, op) => {
    return op.kind === 'brightness' ? sum + op.delta : sum
  }, 0)
  if (totalBrightness !== 0) {
    current = applyBrightness(current, totalBrightness)
  }

  // contrast — accumulate all deltas
  const totalContrast = ops.reduce((sum, op) => {
    return op.kind === 'contrast' ? sum + op.delta : sum
  }, 0)
  if (totalContrast !== 0) {
    current = applyContrast(current, totalContrast)
  }

  // ── Step 5: Overlays (stub — S6) ────────────────────────────────────

  return {
    canvas: current,
    width: current.width,
    height: current.height,
  }
}
