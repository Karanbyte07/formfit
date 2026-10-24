import type { Format, Targets, AppSettings, EncodeStatus } from '../../types'
import { kbToBytes, bytesToKb, calculateMaxAllowedBytes } from '../units'

export interface QualitySearchOptions {
  maxBytes?: number
  minBytes?: number
  maxKb?: number
  minKb?: number
  width?: number
  height?: number
  fixedDimensions?: boolean
  kbBase?: 1024 | 1000
}

export interface QualitySearchResult {
  blob: Blob | null
  quality: number
  status: EncodeStatus
  message: string
}

export interface EncodeResult {
  ok: boolean
  canvas: HTMLCanvasElement
  blob: Blob | null
  kb: number
  width: number
  height: number
  format: Format
  quality: number
  status: EncodeStatus
  message: string
}

/**
 * Draws canvas onto a pure white background to avoid transparent PNGs turning black when encoded as JPEG.
 */
export function prepareCanvasForJpeg(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0)
  }
  return canvas
}

/**
 * Wraps canvas.toBlob in a Promise with a single automatic retry on null at lower quality.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise(resolve => {
    try {
      canvas.toBlob(
        async blob => {
          if (blob) {
            resolve(blob)
          } else {
            // Retry once at slightly lower quality
            if (quality !== undefined && quality > 0.1) {
              const retryQ = Math.max(0.05, quality - 0.1)
              canvas.toBlob(
                retryBlob => resolve(retryBlob),
                type,
                retryQ
              )
            } else {
              resolve(null)
            }
          }
        },
        type,
        quality
      )
    } catch {
      resolve(null)
    }
  })
}

/**
 * Testable binary search for JPEG quality.
 * Takes an injected encodeFn(quality) => Promise<Blob | null> so unit tests can mock it directly.
 */
export async function searchJpegQuality(
  encodeFn: (quality: number) => Promise<Blob | null>,
  options: QualitySearchOptions
): Promise<QualitySearchResult> {
  const kbBase = options.kbBase || 1024
  const { maxBytes, minBytes, maxKb, minKb, width, height } = options

  // 1. If no maxBytes is specified, encode at standard high quality (0.92)
  if (!maxBytes) {
    let blob = await encodeFn(0.92)
    if (!blob) {
      blob = await encodeFn(0.8)
      if (!blob) {
        return {
          blob: null,
          quality: 0.8,
          status: 'failed',
          message: 'Failed to encode image.',
        }
      }
    }

    if (minBytes && blob.size < minBytes) {
      const highBlob = await encodeFn(1.0)
      if (highBlob && highBlob.size >= minBytes) {
        return {
          blob: highBlob,
          quality: 1.0,
          status: 'met',
          message: `Encoded at full quality to meet minimum ${minKb} KB target.`,
        }
      }
      return {
        blob: highBlob || blob,
        quality: 1.0,
        status: 'below_min',
        message: `File size (${bytesToKb((highBlob || blob).size, kbBase)} KB) is below the minimum required ${minKb} KB.`,
      }
    }

    return {
      blob,
      quality: 0.92,
      status: 'met',
      message: `Encoded successfully (${bytesToKb(blob.size, kbBase)} KB).`,
    }
  }

  // 2. Binary search on quality between 0.05 and 0.95 (at most 10 iterations per section 9.2)
  let low = 0.05
  let high = 0.95
  let bestBlob: Blob | null = null
  let bestQuality = 0.05
  let lowestBlob: Blob | null = null

  for (let iter = 0; iter < 10; iter++) {
    const q = Number(((low + high) / 2).toFixed(4))
    const blob = await encodeFn(q)

    if (!blob) {
      return {
        blob: null,
        quality: q,
        status: 'failed',
        message: 'Browser encoding returned empty image data.',
      }
    }

    if (blob.size <= maxBytes) {
      bestBlob = blob
      bestQuality = q
      low = q // Try higher quality
    } else {
      high = q // Too big, reduce quality
    }
  }

  // If after iterations no quality fit, try lowest quality floor 0.05
  if (!bestBlob) {
    lowestBlob = await encodeFn(0.05)
    if (lowestBlob && lowestBlob.size <= maxBytes) {
      bestBlob = lowestBlob
      bestQuality = 0.05
    }
  }

  // 3. Handle case where even lowest quality (0.05) exceeds maxBytes
  if (!bestBlob) {
    if (!lowestBlob) {
      lowestBlob = await encodeFn(0.05)
    }

    const wStr = width ? `${width}` : 'current'
    const hStr = height ? `${height}` : 'dimensions'
    const friendlyMsg = `This image can't reach ${maxKb} KB at ${wStr}×${hStr} without looking very poor. Try a simpler background or a lower pixel size if the form allows.`

    return {
      blob: lowestBlob,
      quality: 0.05,
      status: 'best_effort',
      message: friendlyMsg,
    }
  }

  // 4. Handle min KB constraint
  if (minBytes && bestBlob.size < minBytes) {
    const higherBlob = await encodeFn(1.0)
    if (higherBlob && higherBlob.size <= maxBytes && higherBlob.size >= minBytes) {
      return {
        blob: higherBlob,
        quality: 1.0,
        status: 'met',
        message: `Compressed to ${bytesToKb(higherBlob.size, kbBase)} KB (quality 1.00).`,
      }
    }

    return {
      blob: bestBlob,
      quality: bestQuality,
      status: 'below_min',
      message: `File size (${bytesToKb(bestBlob.size, kbBase)} KB) is below the minimum required ${minKb} KB.`,
    }
  }

  return {
    blob: bestBlob,
    quality: bestQuality,
    status: 'met',
    message: `Compressed to ${bytesToKb(bestBlob.size, kbBase)} KB (quality ${bestQuality.toFixed(2)}).`,
  }
}

/**
 * Downscales a canvas by a specific factor.
 */
function downscaleCanvas(source: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const targetW = Math.max(1, Math.round(source.width * factor))
  const targetH = Math.max(1, Math.round(source.height * factor))
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, 0, 0, targetW, targetH)
  }
  return canvas
}

/**
 * Main encoder function.
 * Coordinates PNG vs JPEG, white background for JPEG, quality binary search,
 * progressive downscaling for non-fixed dimensions, and never throws.
 */
export async function encodeToTarget(
  canvas: HTMLCanvasElement,
  targets?: Targets,
  settings?: AppSettings
): Promise<EncodeResult> {
  const kbBase = settings?.kbBase || 1024
  const safetyMargin = settings?.safetyMargin ?? 0.97
  const format: Format = targets?.format === 'png' ? 'png' : 'jpeg'

  try {
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      return {
        ok: false,
        canvas,
        blob: null,
        kb: 0,
        width: 0,
        height: 0,
        format,
        quality: 1,
        status: 'failed',
        message: 'No canvas content to encode.',
      }
    }

    // ── PNG handling ────────────────────────────────────────────────
    if (format === 'png') {
      const blob = await canvasToBlob(canvas, 'image/png')
      if (!blob) {
        return {
          ok: false,
          canvas,
          blob: null,
          kb: 0,
          width: canvas.width,
          height: canvas.height,
          format: 'png',
          quality: 1,
          status: 'failed',
          message: 'Failed to encode PNG.',
        }
      }

      const kb = bytesToKb(blob.size, kbBase)

      // PNG does not support quality compression. If KB limit is requested, warn user.
      if (targets?.maxKb || targets?.minKb) {
        return {
          ok: false,
          canvas,
          blob,
          kb,
          width: canvas.width,
          height: canvas.height,
          format: 'png',
          quality: 1,
          status: 'png_kb_unsupported',
          message: 'PNG does not support quality compression. Switch to JPG to meet KB limits.',
        }
      }

      return {
        ok: true,
        canvas,
        blob,
        kb,
        width: canvas.width,
        height: canvas.height,
        format: 'png',
        quality: 1,
        status: 'met',
        message: `Saved as PNG (${kb} KB).`,
      }
    }

    // ── JPEG handling ───────────────────────────────────────────────
    let workingCanvas = prepareCanvasForJpeg(canvas)
    const fixedDimensions = Boolean(targets?.widthPx && targets?.heightPx)
    const maxBytes = targets?.maxKb
      ? calculateMaxAllowedBytes(targets.maxKb, kbBase, safetyMargin)
      : undefined
    const minBytes = targets?.minKb ? kbToBytes(targets.minKb, kbBase) : undefined

    const searchOptions: QualitySearchOptions = {
      maxBytes,
      minBytes,
      maxKb: targets?.maxKb,
      minKb: targets?.minKb,
      width: workingCanvas.width,
      height: workingCanvas.height,
      fixedDimensions,
      kbBase,
    }

    let searchRes = await searchJpegQuality(
      q => canvasToBlob(workingCanvas, 'image/jpeg', q),
      searchOptions
    )

    // If even lowest quality did not fit and dimensions are NOT fixed:
    // progressively downscale by x0.9 steps (floor 50% of original)
    if (searchRes.status === 'best_effort' && !fixedDimensions && maxBytes) {
      let currentFactor = 0.9
      while (currentFactor >= 0.5) {
        const downscaled = downscaleCanvas(workingCanvas, currentFactor)
        const stepRes = await searchJpegQuality(
          q => canvasToBlob(downscaled, 'image/jpeg', q),
          {
            ...searchOptions,
            width: downscaled.width,
            height: downscaled.height,
          }
        )

        if (stepRes.status === 'met' && stepRes.blob) {
          workingCanvas = downscaled
          searchRes = stepRes
          break
        }
        currentFactor *= 0.9
      }
    }

    const kb = searchRes.blob ? bytesToKb(searchRes.blob.size, kbBase) : 0

    return {
      ok: searchRes.status !== 'failed',
      canvas: workingCanvas,
      blob: searchRes.blob,
      kb,
      width: workingCanvas.width,
      height: workingCanvas.height,
      format: 'jpeg',
      quality: searchRes.quality,
      status: searchRes.status,
      message: searchRes.message,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown encoding error'
    return {
      ok: false,
      canvas,
      blob: null,
      kb: 0,
      width: canvas.width,
      height: canvas.height,
      format,
      quality: 0.05,
      status: 'failed',
      message: `Encoding failed: ${errorMsg}`,
    }
  }
}
