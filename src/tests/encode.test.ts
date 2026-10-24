import { describe, it, expect } from 'vitest'
import { searchJpegQuality } from '../lib/image/encode'
import { kbToBytes, bytesToKb, calculateMaxAllowedBytes } from '../lib/units'

// Helper mock blob with custom size
function createMockBlob(size: number): Blob {
  const buffer = new Uint8Array(size)
  return new Blob([buffer], { type: 'image/jpeg' })
}

describe('Units & KB conversion', () => {
  it('converts KB to bytes with 1024 base', () => {
    expect(kbToBytes(50, 1024)).toBe(51200)
    expect(bytesToKb(51200, 1024)).toBe(50)
  })

  it('converts KB to bytes with 1000 base', () => {
    expect(kbToBytes(50, 1000)).toBe(50000)
    expect(bytesToKb(50000, 1000)).toBe(50)
  })

  it('calculates max allowed bytes respecting safety margin', () => {
    // 50 KB * 1024 * 0.97 = 49664 bytes
    const maxAllowed1024 = calculateMaxAllowedBytes(50, 1024, 0.97)
    expect(maxAllowed1024).toBe(49664)

    // 50 KB * 1000 * 0.97 = 48500 bytes
    const maxAllowed1000 = calculateMaxAllowedBytes(50, 1000, 0.97)
    expect(maxAllowed1000).toBe(48500)
  })
})

describe('searchJpegQuality binary search', () => {
  it('converges to the highest quality that fits under maxBytes', async () => {
    const maxBytes = calculateMaxAllowedBytes(50, 1024, 0.97) // 49664 bytes

    // Monotonic function: size = 20000 + quality * 40000
    // At q=0.05: size = 22000
    // At q=0.5: size = 40000
    // At q=0.7416: size = 49664
    // At q=0.95: size = 58000
    const mockEncode = async (quality: number) => {
      const size = Math.round(20000 + quality * 40000)
      return createMockBlob(size)
    }

    const result = await searchJpegQuality(mockEncode, {
      maxBytes,
      maxKb: 50,
      kbBase: 1024,
    })

    expect(result.status).toBe('met')
    expect(result.blob).not.toBeNull()
    expect(result.blob!.size).toBeLessThanOrEqual(maxBytes)
    // Quality should be near 0.74
    expect(result.quality).toBeGreaterThanOrEqual(0.7)
    expect(result.quality).toBeLessThanOrEqual(0.76)
  })

  it('returns best_effort when even lowest quality 0.05 exceeds maxBytes', async () => {
    const maxBytes = calculateMaxAllowedBytes(10, 1024, 0.97) // 9932 bytes

    // Even at q=0.05, size is 25000 > 9932
    const mockEncode = async (quality: number) => {
      const size = Math.round(25000 + quality * 10000)
      return createMockBlob(size)
    }

    const result = await searchJpegQuality(mockEncode, {
      maxBytes,
      maxKb: 10,
      width: 200,
      height: 230,
      fixedDimensions: true,
      kbBase: 1024,
    })

    expect(result.status).toBe('best_effort')
    expect(result.quality).toBe(0.05)
    expect(result.message).toContain("can't reach 10 KB at 200×230 without looking very poor")
  })

  it('returns below_min when maximum quality size is still below minBytes', async () => {
    const minBytes = kbToBytes(20, 1024) // 20480 bytes

    // Even at q=1.0, size is 12000 < 20480
    const mockEncode = async (quality: number) => {
      const size = Math.round(5000 + quality * 7000)
      return createMockBlob(size)
    }

    const result = await searchJpegQuality(mockEncode, {
      minBytes,
      minKb: 20,
      kbBase: 1024,
    })

    expect(result.status).toBe('below_min')
    expect(result.quality).toBe(1.0)
    expect(result.message).toContain('below the minimum required 20 KB')
  })

  it('retries once on null blob and returns failed if still null', async () => {
    let callCount = 0
    const mockEncode = async () => {
      callCount++
      return null
    }

    const result = await searchJpegQuality(mockEncode, {
      maxBytes: 50000,
      maxKb: 50,
      kbBase: 1024,
    })

    expect(result.status).toBe('failed')
    expect(result.blob).toBeNull()
    expect(callCount).toBeGreaterThanOrEqual(1)
  })
})
