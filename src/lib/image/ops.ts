// Pure math functions for testing and pipeline calculations

export function calculateRotatedDimensions(
  width: number,
  height: number,
  degrees: 90 | 180 | 270
): { width: number; height: number } {
  if (degrees === 90 || degrees === 270) {
    return { width: height, height: width }
  }
  return { width, height }
}

export function calculateCenterCropRect(
  srcWidth: number,
  srcHeight: number,
  targetAspect: number
): { x: number; y: number; width: number; height: number } {
  if (targetAspect <= 0 || srcWidth <= 0 || srcHeight <= 0) {
    return { x: 0, y: 0, width: srcWidth, height: srcHeight }
  }

  const currentAspect = srcWidth / srcHeight
  const epsilon = 0.0001

  if (Math.abs(currentAspect - targetAspect) < epsilon) {
    return { x: 0, y: 0, width: srcWidth, height: srcHeight }
  }

  if (currentAspect > targetAspect) {
    // Source is wider than target aspect -> crop left & right
    const cropHeight = srcHeight
    const cropWidth = Math.round(srcHeight * targetAspect)
    const x = Math.max(0, Math.round((srcWidth - cropWidth) / 2))
    return { x, y: 0, width: cropWidth, height: cropHeight }
  } else {
    // Source is taller than target aspect -> crop top & bottom
    const cropWidth = srcWidth
    const cropHeight = Math.round(srcWidth / targetAspect)
    const y = Math.max(0, Math.round((srcHeight - cropHeight) / 2))
    return { x: 0, y, width: cropWidth, height: cropHeight }
  }
}

export function calculateStepDownDimensions(
  currentW: number,
  currentH: number,
  targetW: number,
  targetH: number
): Array<{ width: number; height: number }> {
  const steps: Array<{ width: number; height: number }> = []
  let w = currentW
  let h = currentH

  // Repeatedly halve until within 2x of target
  while (w / 2 >= targetW && h / 2 >= targetH) {
    w = Math.floor(w / 2)
    h = Math.floor(h / 2)
    steps.push({ width: w, height: h })
  }

  // Always end on exact target
  if (w !== targetW || h !== targetH) {
    steps.push({ width: targetW, height: targetH })
  }

  return steps
}

// Canvas-based image operations

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

export function rotateCanvas(
  source: HTMLCanvasElement | ImageBitmap,
  degrees: 90 | 180 | 270
): HTMLCanvasElement {
  const { width: newW, height: newH } = calculateRotatedDimensions(source.width, source.height, degrees)
  const canvas = createCanvas(newW, newH)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (degrees === 90) {
    ctx.translate(newW, 0)
    ctx.rotate((90 * Math.PI) / 180)
  } else if (degrees === 180) {
    ctx.translate(newW, newH)
    ctx.rotate((180 * Math.PI) / 180)
  } else if (degrees === 270) {
    ctx.translate(0, newH)
    ctx.rotate((270 * Math.PI) / 180)
  }

  ctx.drawImage(source, 0, 0)
  return canvas
}

export function flipCanvas(
  source: HTMLCanvasElement | ImageBitmap,
  axis: 'h' | 'v'
): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (axis === 'h') {
    ctx.translate(source.width, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(0, source.height)
    ctx.scale(1, -1)
  }

  ctx.drawImage(source, 0, 0)
  return canvas
}

export function cropCanvas(
  source: HTMLCanvasElement | ImageBitmap,
  rect: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = createCanvas(rect.width, rect.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
  return canvas
}

export function centerCropToAspect(
  source: HTMLCanvasElement | ImageBitmap,
  ratio: number
): HTMLCanvasElement {
  const rect = calculateCenterCropRect(source.width, source.height, ratio)
  return cropCanvas(source, rect)
}

export function resizeTo(
  source: HTMLCanvasElement | ImageBitmap,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const targetW = Math.max(1, Math.round(targetWidth))
  const targetH = Math.max(1, Math.round(targetHeight))

  // If no change needed
  if (source.width === targetW && source.height === targetH) {
    const canvas = createCanvas(targetW, targetH)
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(source, 0, 0)
    return canvas
  }

  const steps = calculateStepDownDimensions(source.width, source.height, targetW, targetH)

  // If single direct step or upscale
  if (steps.length <= 1) {
    const canvas = createCanvas(targetW, targetH)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(source, 0, 0, targetW, targetH)
    }
    return canvas
  }

  // Multi-step downscaling for high quality and anti-aliasing
  let currentSource: HTMLCanvasElement | ImageBitmap = source
  for (const step of steps) {
    const nextCanvas = createCanvas(step.width, step.height)
    const nextCtx = nextCanvas.getContext('2d')
    if (nextCtx) {
      nextCtx.imageSmoothingEnabled = true
      nextCtx.imageSmoothingQuality = 'high'
      nextCtx.drawImage(currentSource, 0, 0, step.width, step.height)
    }
    currentSource = nextCanvas
  }

  return currentSource as HTMLCanvasElement
}

// ── Color operations (spec § 6.4, § 8) ───────────────────────────────────────

/**
 * Applies a white background behind any transparent pixels.
 * Also flattens for JPEG encoding.
 */
export function applyWhiteBackground(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0)
  return canvas
}

/**
 * Converts image to grayscale using luminance formula: 0.299R + 0.587G + 0.114B
 */
export function applyGrayscale(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(source, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    data[i] = lum
    data[i + 1] = lum
    data[i + 2] = lum
    // alpha unchanged
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Applies a brightness adjustment. Delta is added to each RGB channel, clamped 0-255.
 * @param delta — positive = brighter, negative = darker
 */
export function applyBrightness(source: HTMLCanvasElement, delta: number): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(source, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.max(0, Math.min(255, data[i]     + delta))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + delta))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + delta))
    // alpha unchanged
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Applies a contrast adjustment using a linear stretch around 128.
 * factor = 1.0 means no change; positive delta increases contrast, negative decreases.
 * @param delta — units in [-100, 100] range; mapped to factor
 */
export function applyContrast(source: HTMLCanvasElement, delta: number): HTMLCanvasElement {
  const canvas = createCanvas(source.width, source.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(source, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  // Map delta to a contrast factor: 0 = no change, positive = more contrast
  const factor = (259 * (delta + 255)) / (255 * (259 - delta))
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.max(0, Math.min(255, factor * (data[i]     - 128) + 128))
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128))
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128))
    // alpha unchanged
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}
