export type LoadImageResult =
  | {
      ok: true
      bitmap: ImageBitmap
      width: number
      height: number
      fileName: string
      fileSize: number
      wasDownscaled: boolean
    }
  | {
      ok: false
      message: string
    }

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB
const MAX_DIMENSION = 4000 // 4000 px longest side safeguard

export function closeBitmap(bitmap?: ImageBitmap | null) {
  if (bitmap && typeof bitmap.close === 'function') {
    try {
      bitmap.close()
    } catch {
      // Ignore if already closed
    }
  }
}

export async function loadImageFile(file: File): Promise<LoadImageResult> {
  try {
    if (!file) {
      return { ok: false, message: 'No file provided.' }
    }

    // 1. Check file size
    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1)
      return {
        ok: false,
        message: `File is too large (${mb} MB). Maximum allowed size is 20 MB.`,
      }
    }

    // 2. Check format / extension
    const nameLower = file.name.toLowerCase()
    const typeLower = (file.type || '').toLowerCase()

    if (
      typeLower.includes('heic') ||
      typeLower.includes('heif') ||
      nameLower.endsWith('.heic') ||
      nameLower.endsWith('.heif')
    ) {
      return {
        ok: false,
        message: "This format can't be opened in the browser. Export as JPG or PNG and try again.",
      }
    }

    const isJpg = typeLower === 'image/jpeg' || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')
    const isPng = typeLower === 'image/png' || nameLower.endsWith('.png')
    const isWebp = typeLower === 'image/webp' || nameLower.endsWith('.webp')

    if (!isJpg && !isPng && !isWebp) {
      const ext = nameLower.includes('.') ? nameLower.split('.').pop()?.toUpperCase() : 'Unknown'
      return {
        ok: false,
        message: `Unsupported file type (${ext}). Please select a JPG, PNG, or WebP image.`,
      }
    }

    // 3. Decode into ImageBitmap
    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(file)
    } catch {
      return {
        ok: false,
        message: 'Could not decode image. The file might be corrupted or invalid.',
      }
    }

    let wasDownscaled = false
    const longest = Math.max(bitmap.width, bitmap.height)

    // 4. Downscale safeguard if longest side > 4000 px
    if (longest > MAX_DIMENSION) {
      try {
        const scale = MAX_DIMENSION / longest
        const targetW = Math.round(bitmap.width * scale)
        const targetH = Math.round(bitmap.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(bitmap, 0, 0, targetW, targetH)

          const downscaled = await createImageBitmap(canvas)
          bitmap.close()
          bitmap = downscaled
          wasDownscaled = true
        }
      } catch {
        // If downscale fails, we keep the original bitmap safely
      }
    }

    return {
      ok: true,
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      fileName: file.name,
      fileSize: file.size,
      wasDownscaled,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return {
      ok: false,
      message: `Failed to load image: ${errorMsg}`,
    }
  }
}
