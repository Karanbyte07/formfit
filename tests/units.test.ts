import { describe, it, expect } from 'vitest'
import {
  cmToPx,
  mmToCm,
  kbToBytes,
  bytesToKb,
  calculateMaxAllowedBytes,
} from '../src/lib/units'

describe('cmToPx', () => {
  it('converts 1 cm at 300 dpi', () => {
    expect(cmToPx(1, 300)).toBe(118) // round(1/2.54 * 300) = round(118.11) = 118
  })

  it('converts 3.5 cm at 300 dpi', () => {
    expect(cmToPx(3.5, 300)).toBe(413) // round(3.5/2.54*300) = round(413.38) = 413
  })

  it('converts 4.5 cm at 300 dpi', () => {
    expect(cmToPx(4.5, 300)).toBe(531) // round(4.5/2.54*300) = round(531.49) = 531
  })

  it('converts 1 cm at 200 dpi', () => {
    expect(cmToPx(1, 200)).toBe(79) // round(1/2.54*200) = round(78.74) = 79
  })

  it('converts 1 cm at 150 dpi', () => {
    expect(cmToPx(1, 150)).toBe(59) // round(1/2.54*150) = round(59.05) = 59
  })

  it('uses 300 dpi by default', () => {
    expect(cmToPx(1)).toBe(cmToPx(1, 300))
  })
})

describe('mmToCm', () => {
  it('converts 10 mm to 1 cm', () => {
    expect(mmToCm(10)).toBe(1)
  })

  it('converts 35 mm to 3.5 cm', () => {
    expect(mmToCm(35)).toBe(3.5)
  })

  it('converts 0 mm', () => {
    expect(mmToCm(0)).toBe(0)
  })
})

describe('kbToBytes', () => {
  it('converts 50 KB at base 1024', () => {
    expect(kbToBytes(50, 1024)).toBe(51200)
  })

  it('converts 50 KB at base 1000', () => {
    expect(kbToBytes(50, 1000)).toBe(50000)
  })

  it('uses 1024 by default', () => {
    expect(kbToBytes(1)).toBe(1024)
  })
})

describe('bytesToKb', () => {
  it('converts 51200 bytes at base 1024 → 50 KB', () => {
    expect(bytesToKb(51200, 1024)).toBe(50)
  })

  it('converts 50000 bytes at base 1000 → 50 KB', () => {
    expect(bytesToKb(50000, 1000)).toBe(50)
  })

  it('rounds to 1 decimal', () => {
    expect(bytesToKb(51201, 1024)).toBe(50.0)
  })
})

describe('calculateMaxAllowedBytes', () => {
  it('applies 97% safety margin at base 1024', () => {
    // 50 * 1024 * 0.97 = 49664
    expect(calculateMaxAllowedBytes(50, 1024, 0.97)).toBe(49664)
  })

  it('applies 97% safety margin at base 1000', () => {
    // 50 * 1000 * 0.97 = 48500
    expect(calculateMaxAllowedBytes(50, 1000, 0.97)).toBe(48500)
  })

  it('uses defaults (1024, 0.97)', () => {
    const v = calculateMaxAllowedBytes(50)
    expect(v).toBe(49664)
  })
})
