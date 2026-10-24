import { describe, it, expect } from 'vitest'
import {
  calculateRotatedDimensions,
  calculateCenterCropRect,
  calculateStepDownDimensions,
} from '../lib/image/ops'

describe('calculateRotatedDimensions', () => {
  it('swaps width and height for 90 degrees', () => {
    const result = calculateRotatedDimensions(200, 300, 90)
    expect(result).toEqual({ width: 300, height: 200 })
  })

  it('swaps width and height for 270 degrees', () => {
    const result = calculateRotatedDimensions(400, 150, 270)
    expect(result).toEqual({ width: 150, height: 400 })
  })

  it('preserves width and height for 180 degrees', () => {
    const result = calculateRotatedDimensions(640, 480, 180)
    expect(result).toEqual({ width: 640, height: 480 })
  })
})

describe('calculateCenterCropRect', () => {
  it('centers crop horizontally on wider images', () => {
    // 300x100 source, target aspect 1:1 (ratio = 1.0)
    // cropWidth should be 100, x offset should be (300 - 100)/2 = 100
    const rect = calculateCenterCropRect(300, 100, 1.0)
    expect(rect).toEqual({ x: 100, y: 0, width: 100, height: 100 })
  })

  it('centers crop vertically on taller images', () => {
    // 100x300 source, target aspect 1:1 (ratio = 1.0)
    // cropHeight should be 100, y offset should be (300 - 100)/2 = 100
    const rect = calculateCenterCropRect(100, 300, 1.0)
    expect(rect).toEqual({ x: 0, y: 100, width: 100, height: 100 })
  })

  it('returns full rectangle when aspect ratio matches', () => {
    const rect = calculateCenterCropRect(200, 230, 200 / 230)
    expect(rect).toEqual({ x: 0, y: 0, width: 200, height: 230 })
  })
})

describe('calculateStepDownDimensions', () => {
  it('halves dimensions until near target for big shrink ratios', () => {
    const steps = calculateStepDownDimensions(1000, 1000, 100, 100)
    // 1000 -> 500 -> 250 -> 125 -> 100
    expect(steps.length).toBeGreaterThan(1)
    expect(steps[steps.length - 1]).toEqual({ width: 100, height: 100 })
  })

  it('provides single step for small resize', () => {
    const steps = calculateStepDownDimensions(250, 250, 200, 200)
    expect(steps).toEqual([{ width: 200, height: 200 }])
  })
})
