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
