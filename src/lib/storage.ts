/**
 * storage.ts — safe localStorage helper for presets and settings (spec § 4.2 S4, § 12)
 *
 * All accesses are wrapped in try/catch to ensure zero crashes in private
 * browsing, iframe sandboxes, or when storage is quota-exhausted or disabled.
 */
import type { AppSettings, Preset } from '../types'

const PRESETS_STORAGE_KEY = 'formfit_presets_v1'
const SETTINGS_STORAGE_KEY = 'formfit_settings_v1'

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'example-std-photo',
    name: 'Example: Standard Photo (200×230 px, 20–50 KB, JPG)',
    slot: 'photo',
    isDefault: true,
    targets: { widthPx: 200, heightPx: 230, minKb: 20, maxKb: 50, format: 'jpeg' },
    ops: [
      { kind: 'resize_px', width: 200, height: 230 },
      { kind: 'min_kb', kb: 20 },
      { kind: 'max_kb', kb: 50 },
      { kind: 'format', format: 'jpeg' },
      { kind: 'white_bg' },
    ],
  },
  {
    id: 'example-std-signature',
    name: 'Example: Standard Signature (140×60 px, 10–20 KB, JPG)',
    slot: 'signature',
    isDefault: true,
    targets: { widthPx: 140, heightPx: 60, minKb: 10, maxKb: 20, format: 'jpeg' },
    ops: [
      { kind: 'resize_px', width: 140, height: 60 },
      { kind: 'min_kb', kb: 10 },
      { kind: 'max_kb', kb: 20 },
      { kind: 'format', format: 'jpeg' },
      { kind: 'signature_clean', threshold: 165 },
    ],
  },
  {
    id: 'example-metric-photo',
    name: 'Example: Metric Photo (3.5×4.5 cm, max 50 KB, JPG)',
    slot: 'photo',
    isDefault: true,
    targets: { widthPx: 413, heightPx: 531, maxKb: 50, format: 'jpeg' },
    ops: [
      { kind: 'resize_cm', widthCm: 3.5, heightCm: 4.5, dpi: 300 },
      { kind: 'max_kb', kb: 50 },
      { kind: 'format', format: 'jpeg' },
    ],
  },
]

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage
    }
    return null
  } catch {
    return null
  }
}

export function loadStoredPresets(): Preset[] {
  try {
    const storage = getStorage()
    if (!storage) return DEFAULT_PRESETS

    const raw = storage.getItem(PRESETS_STORAGE_KEY)
    if (!raw) return DEFAULT_PRESETS

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PRESETS
    }

    // Merge custom presets with defaults (defaults always available)
    const custom = parsed.filter(
      (p: Preset) => !DEFAULT_PRESETS.some(d => d.id === p.id)
    )
    return [...DEFAULT_PRESETS, ...custom]
  } catch {
    return DEFAULT_PRESETS
  }
}

export function saveStoredPresets(presets: Preset[]): boolean {
  try {
    const storage = getStorage()
    if (!storage) return false

    storage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
    return true
  } catch {
    return false
  }
}

export function loadStoredSettings(): Partial<AppSettings> | null {
  try {
    const storage = getStorage()
    if (!storage) return null

    const raw = storage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveStoredSettings(settings: AppSettings): boolean {
  try {
    const storage = getStorage()
    if (!storage) return false

    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}
