import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_PRESETS,
  loadStoredPresets,
  saveStoredPresets,
  loadStoredSettings,
  saveStoredSettings,
} from '../src/lib/storage'
import { parseCommand } from '../src/lib/parser/parse'
import { applySignatureClean } from '../src/lib/image/ops'
import type { Preset, AppSettings } from '../src/types'

describe('storage.ts — Safe LocalStorage Presets & Settings', () => {
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    })
  })

  it('provides the 3 required example presets with honesty disclaimer compatibility', () => {
    expect(DEFAULT_PRESETS).toHaveLength(3)
    const [photo, sig, metric] = DEFAULT_PRESETS

    expect(photo.name).toContain('Standard Photo')
    expect(photo.targets.widthPx).toBe(200)
    expect(photo.targets.heightPx).toBe(230)
    expect(photo.targets.maxKb).toBe(50)

    expect(sig.name).toContain('Standard Signature')
    expect(sig.targets.widthPx).toBe(140)
    expect(sig.targets.heightPx).toBe(60)

    expect(metric.name).toContain('Metric Photo')
    expect(metric.targets.maxKb).toBe(50)
  })

  it('returns DEFAULT_PRESETS when storage is empty', () => {
    const presets = loadStoredPresets()
    expect(presets).toHaveLength(3)
    expect(presets[0].id).toBe('example-std-photo')
  })

  it('persists and loads custom presets while retaining defaults', () => {
    const custom: Preset = {
      id: 'custom-upsc-1',
      name: 'Custom UPSC 350x350',
      slot: 'photo',
      targets: { widthPx: 350, heightPx: 350, maxKb: 100 },
      ops: [{ kind: 'resize_px', width: 350, height: 350 }],
      isDefault: false,
    }

    const saved = saveStoredPresets([...DEFAULT_PRESETS, custom])
    expect(saved).toBe(true)

    const loaded = loadStoredPresets()
    expect(loaded).toHaveLength(4)
    expect(loaded.some(p => p.id === 'custom-upsc-1')).toBe(true)
  })

  it('handles corrupted JSON in localStorage gracefully without throwing', () => {
    store['formfit_presets_v1'] = 'INVALID_JSON_CORRUPTED{'
    const presets = loadStoredPresets()
    expect(presets).toEqual(DEFAULT_PRESETS)
  })

  it('saves and loads AppSettings safely', () => {
    const settings: AppSettings = {
      kbBase: 1000,
      dpi: 200,
      safetyMargin: 0.95,
    }

    const saved = saveStoredSettings(settings)
    expect(saved).toBe(true)

    const loaded = loadStoredSettings()
    expect(loaded).toEqual(settings)
  })

  it('handles localStorage throwing (e.g. Safari private quota) without crashing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('QuotaExceededError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    })

    expect(() => loadStoredPresets()).not.toThrow()
    expect(loadStoredPresets()).toEqual(DEFAULT_PRESETS)
    expect(saveStoredPresets(DEFAULT_PRESETS)).toBe(false)
  })
})

describe('Day 6 Intents: signature_clean, overlay_text, crop', () => {
  it('parses signature_clean commands in English and Hinglish', () => {
    const commands = [
      'clean signature',
      'signature saaf karo',
      'sign clean karo',
      'ink dark karo',
      'remove paper shadow',
      'contrast signature',
    ]

    for (const cmd of commands) {
      const res = parseCommand(cmd)
      const op = res.intents.find(o => o.kind === 'signature_clean')
      expect(op, `Failed on: "${cmd}"`).toBeDefined()
      if (op && op.kind === 'signature_clean') {
        expect(op.threshold).toBe(165)
      }
    }
  })

  it('parses custom threshold for signature_clean', () => {
    const res = parseCommand('threshold 195 signature clean')
    const op = res.intents.find(o => o.kind === 'signature_clean')
    expect(op).toBeDefined()
    if (op && op.kind === 'signature_clean') {
      expect(op.threshold).toBe(195)
    }
  })

  it('parses overlay_text (Name & Date strip) commands in English and Hinglish', () => {
    const commands = [
      'add name and date',
      'naam aur date lagao',
      'bottom strip add karo',
      'photo me name date strip dalo',
    ]

    for (const cmd of commands) {
      const res = parseCommand(cmd)
      const op = res.intents.find(o => o.kind === 'overlay_text')
      expect(op, `Failed on: "${cmd}"`).toBeDefined()
      if (op && op.kind === 'overlay_text') {
        expect(op.text).toBeDefined()
        expect(op.date).toMatch(/\d{2}\/\d{2}\/\d{4}/)
      }
    }
  })

  it('parses custom name and date in overlay_text command', () => {
    const res = parseCommand('name Vikram date 26/01/2026 add strip')
    const op = res.intents.find(o => o.kind === 'overlay_text')
    expect(op).toBeDefined()
    if (op && op.kind === 'overlay_text') {
      expect(op.text).toBe('Vikram')
      expect(op.date).toBe('26/01/2026')
    }
  })

  it('parses manual crop commands', () => {
    const c1 = parseCommand('crop karo')
    expect(c1.intents.some(o => o.kind === 'crop')).toBe(true)

    const c2 = parseCommand('crop to passport ratio')
    const cropOp = c2.intents.find(o => o.kind === 'crop')
    expect(cropOp).toBeDefined()
    if (cropOp && cropOp.kind === 'crop') {
      expect(cropOp.aspect).toBeCloseTo(3.5 / 4.5, 2)
    }

    const c3 = parseCommand('manual crop')
    expect(c3.intents.some(o => o.kind === 'crop')).toBe(true)
  })
})

describe('Image Operations: applySignatureClean', () => {
  it('pushes background shadow pixels to pure white and darkens ink pixels', () => {
    const pixels = new Uint8ClampedArray(4 * 2) // 2 pixels: 1 light shadow, 1 dark ink
    // Pixel 0: light gray paper shadow (R=180, G=180, B=180) -> luminance = 180 > 165
    pixels[0] = 180
    pixels[1] = 180
    pixels[2] = 180
    pixels[3] = 255

    // Pixel 1: dark blue/black ink (R=60, G=70, B=100) -> luminance < 165
    pixels[4] = 60
    pixels[5] = 70
    pixels[6] = 100
    pixels[7] = 255

    const imageData = {
      data: pixels,
      width: 2,
      height: 1,
    } as unknown as ImageData

    const fakeCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => imageData),
      putImageData: vi.fn(),
    }

    const fakeCanvas = {
      width: 2,
      height: 1,
      getContext: vi.fn(() => fakeCtx),
    } as unknown as HTMLCanvasElement

    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        if (tag === 'canvas') return fakeCanvas
        return {}
      },
    })

    const result = applySignatureClean(fakeCanvas, 165)
    expect(result).toBe(fakeCanvas)
    expect(fakeCtx.putImageData).toHaveBeenCalled()

    // Pixel 0 (light shadow above 165) must become pure white (255, 255, 255)
    expect(pixels[0]).toBe(255)
    expect(pixels[1]).toBe(255)
    expect(pixels[2]).toBe(255)

    // Pixel 1 (ink below 165) must be darkened (lower RGB values than original)
    expect(pixels[4]).toBeLessThan(60)
    expect(pixels[5]).toBeLessThan(70)
    expect(pixels[6]).toBeLessThan(100)
  })
})
