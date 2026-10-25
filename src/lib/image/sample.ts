/**
 * sample.ts — Generates synthetic sample images at runtime (spec § 4.2 S2, § 6.1)
 *
 * Provides dedicated synthetic samples per slot:
 * - Photo: stylized 3000×4000 portrait avatar
 * - Signature: realistic dark-ink handwritten cursive signature on off-white paper
 * - Thumb: synthetic thumbprint whorl pattern on paper
 *
 * No external network requests; all generated dynamically in-memory on HTMLCanvas.
 */
import type { SlotId } from '../../types'

export async function generateSamplePortraitFile(): Promise<File> {
  const width = 3000
  const height = 4000
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // 1. Studio backdrop gradient
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.4,
    width * 0.1,
    width / 2,
    height * 0.5,
    width * 0.9
  )
  bgGrad.addColorStop(0, '#E0F2FE')
  bgGrad.addColorStop(0.5, '#BAE6FD')
  bgGrad.addColorStop(1, '#7DD3FC')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Stylized vector avatar
  ctx.fillStyle = '#0F766E'
  ctx.beginPath()
  ctx.moveTo(width * 0.15, height)
  ctx.bezierCurveTo(
    width * 0.2,
    height * 0.72,
    width * 0.35,
    height * 0.68,
    width * 0.5,
    height * 0.68
  )
  ctx.bezierCurveTo(
    width * 0.65,
    height * 0.68,
    width * 0.8,
    height * 0.72,
    width * 0.85,
    height
  )
  ctx.closePath()
  ctx.fill()

  // Inner shirt / collar
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(width * 0.4, height * 0.68)
  ctx.lineTo(width * 0.5, height * 0.82)
  ctx.lineTo(width * 0.6, height * 0.68)
  ctx.closePath()
  ctx.fill()

  // Neck
  ctx.fillStyle = '#FBBF24'
  ctx.fillRect(width * 0.43, height * 0.52, width * 0.14, height * 0.18)

  // Head
  ctx.fillStyle = '#F59E0B'
  ctx.beginPath()
  ctx.ellipse(width / 2, height * 0.42, width * 0.18, height * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = '#1E293B'
  ctx.beginPath()
  ctx.arc(width / 2, height * 0.38, width * 0.19, Math.PI, Math.PI * 2)
  ctx.fill()

  // Spectacles
  ctx.lineWidth = 28
  ctx.strokeStyle = '#1E293B'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'

  ctx.beginPath()
  ctx.roundRect(width * 0.35, height * 0.38, width * 0.12, height * 0.08, 40)
  ctx.stroke()
  ctx.fill()

  ctx.beginPath()
  ctx.roundRect(width * 0.53, height * 0.38, width * 0.12, height * 0.08, 40)
  ctx.stroke()
  ctx.fill()

  // Bridge
  ctx.beginPath()
  ctx.moveTo(width * 0.47, height * 0.42)
  ctx.lineTo(width * 0.53, height * 0.42)
  ctx.stroke()

  // Smile
  ctx.lineWidth = 18
  ctx.beginPath()
  ctx.arc(width / 2, height * 0.49, width * 0.05, 0.1 * Math.PI, 0.9 * Math.PI)
  ctx.stroke()

  // Subtle noise layer
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  for (let i = 0; i < data.length; i += 12) {
    const noise = (Math.random() - 0.5) * 18
    data[i] = Math.min(255, Math.max(0, data[i] + noise))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
  }
  ctx.putImageData(imgData, 0, 0)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Failed to create sample blob'))),
      'image/jpeg',
      0.9
    )
  })

  return new File([blob], 'sample-photo-3000x4000.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export async function generateSampleSignatureFile(): Promise<File> {
  const width = 1400
  const height = 600
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Canvas 2D context not available')

  // 1. Off-white paper background
  ctx.fillStyle = '#FDFCF7'
  ctx.fillRect(0, 0, width, height)

  // Faint paper texture noise
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  for (let i = 0; i < data.length; i += 8) {
    const n = (Math.random() - 0.5) * 8
    data[i] = Math.min(255, Math.max(0, data[i] + n))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n))
  }
  ctx.putImageData(imgData, 0, 0)

  // 2. Realistic dark blue-black fountain ink signature
  ctx.strokeStyle = '#0F172A'
  ctx.fillStyle = '#0F172A'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Capital initial flourish
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.moveTo(180, 420)
  ctx.bezierCurveTo(220, 160, 260, 140, 310, 240)
  ctx.bezierCurveTo(340, 320, 280, 460, 360, 410)
  ctx.stroke()

  // Connected cursive loops & strokes
  ctx.lineWidth = 11
  ctx.beginPath()
  ctx.moveTo(360, 410)
  ctx.bezierCurveTo(420, 350, 460, 280, 480, 380)
  ctx.bezierCurveTo(500, 440, 540, 440, 570, 340)
  ctx.bezierCurveTo(590, 260, 630, 280, 660, 380)
  ctx.bezierCurveTo(680, 420, 720, 430, 760, 320)
  ctx.bezierCurveTo(790, 240, 830, 260, 870, 370)
  ctx.bezierCurveTo(900, 430, 940, 420, 990, 310)
  ctx.bezierCurveTo(1020, 250, 1060, 290, 1090, 390)
  ctx.stroke()

  // Tapered underline flourish
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(280, 460)
  ctx.bezierCurveTo(550, 490, 900, 470, 1200, 420)
  ctx.stroke()

  // Two dots under flourish
  ctx.beginPath()
  ctx.arc(880, 510, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(930, 508, 5, 0, Math.PI * 2)
  ctx.fill()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Failed to create signature blob'))),
      'image/jpeg',
      0.95
    )
  })

  return new File([blob], 'sample-signature.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export async function generateSampleThumbFile(): Promise<File> {
  const width = 1000
  const height = 1200
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Canvas 2D context not available')

  // 1. Paper background
  ctx.fillStyle = '#FAF9F5'
  ctx.fillRect(0, 0, width, height)

  // 2. Thumbprint stamp impression (concentric ridges with ink variations)
  ctx.save()
  // Clip to realistic thumbprint oval boundary
  ctx.beginPath()
  ctx.ellipse(width / 2, height / 2, 280, 420, 0.05, 0, Math.PI * 2)
  ctx.clip()

  // Draw concentric whorls
  const centerX = width / 2
  const centerY = height / 2 + 30
  const inkColor = '#312E81' // Classic stamp-pad violet-blue ink

  ctx.strokeStyle = inkColor
  ctx.lineCap = 'round'

  for (let r = 18; r < 360; r += 16) {
    ctx.lineWidth = 6 + (Math.sin(r) * 2)
    ctx.globalAlpha = 0.72 + (Math.sin(r * 0.8) * 0.18)

    ctx.beginPath()
    // Elliptical arch/whorl with slight irregularities
    const steps = 40
    for (let s = 0; s <= steps; s++) {
      const angle = (s / steps) * Math.PI * 2
      // Add subtle waviness
      const distortion = Math.sin(angle * 5) * 4 + Math.cos(angle * 3) * 3
      const rx = (r * 0.75 + distortion)
      const ry = (r * 1.15 + distortion)
      const x = centerX + Math.cos(angle) * rx
      const y = centerY + Math.sin(angle) * ry
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Slight ink smudge / central core
  ctx.fillStyle = inkColor
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.ellipse(centerX, centerY - 20, 40, 60, 0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()

  // Paper noise
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  for (let i = 0; i < data.length; i += 12) {
    const n = (Math.random() - 0.5) * 10
    data[i] = Math.min(255, Math.max(0, data[i] + n))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n))
  }
  ctx.putImageData(imgData, 0, 0)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Failed to create thumb blob'))),
      'image/jpeg',
      0.95
    )
  })

  return new File([blob], 'sample-thumb.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

/**
 * Universal sample generator for any slot
 */
export async function generateSampleImageFile(slotId: SlotId = 'photo'): Promise<File> {
  if (slotId === 'signature') {
    return generateSampleSignatureFile()
  }
  if (slotId === 'thumb') {
    return generateSampleThumbFile()
  }
  return generateSamplePortraitFile()
}
