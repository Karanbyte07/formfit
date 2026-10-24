/**
 * Generates a synthetic illustrated portrait at runtime on a 3000×4000 canvas.
 * Uses geometric shapes, gradients, and subtle noise to produce a realistic
 * high-resolution file (~1-2 MB JPEG). Does NOT look like a real person.
 */
export async function generateSampleImageFile(): Promise<File> {
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
  bgGrad.addColorStop(0, '#E0F2FE') // soft sky blue center
  bgGrad.addColorStop(0.5, '#BAE6FD')
  bgGrad.addColorStop(1, '#7DD3FC') // deeper slate-blue edge
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Geometric mannequin / stylized vector avatar (not a real human)
  // Shoulders & torso
  ctx.fillStyle = '#0F766E' // FormFit accent teal
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
  ctx.fillStyle = '#FBBF24' // Warm stylized tone
  ctx.fillRect(width * 0.43, height * 0.52, width * 0.14, height * 0.18)

  // Geometric head (oval)
  ctx.fillStyle = '#F59E0B'
  ctx.beginPath()
  ctx.ellipse(width / 2, height * 0.42, width * 0.18, height * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()

  // Stylized hair (geometric modern arc)
  ctx.fillStyle = '#1E293B'
  ctx.beginPath()
  ctx.arc(width / 2, height * 0.38, width * 0.19, Math.PI, Math.PI * 2)
  ctx.fill()

  // Abstract spectacles (distinct illustrative avatar look)
  ctx.lineWidth = 28
  ctx.strokeStyle = '#1E293B'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'

  // Left frame
  ctx.beginPath()
  ctx.roundRect(width * 0.35, height * 0.38, width * 0.12, height * 0.08, 40)
  ctx.stroke()
  ctx.fill()

  // Right frame
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

  // 3. Subtle noise layer so JPEG encoder cannot collapse it (keeps size ~1MB+)
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data
  // Apply random noise across pixels (stride of 3 to stay performant on 12M pixels)
  for (let i = 0; i < data.length; i += 12) {
    const noise = (Math.random() - 0.5) * 18
    data[i] = Math.min(255, Math.max(0, data[i] + noise))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
  }
  ctx.putImageData(imgData, 0, 0)

  // 4. Convert canvas to JPEG blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => {
        if (b) resolve(b)
        else reject(new Error('Failed to create sample blob'))
      },
      'image/jpeg',
      0.9
    )
  })

  // 5. Wrap in File object
  return new File([blob], 'sample-avatar-3000x4000.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
