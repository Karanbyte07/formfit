export type Format = 'jpeg' | 'png' | 'webp'

export type Intent =
  | { kind: 'resize_px'; width: number; height: number }
  | { kind: 'resize_cm'; widthCm: number; heightCm: number; dpi: number }
  | { kind: 'max_kb'; kb: number }
  | { kind: 'min_kb'; kb: number }
  | { kind: 'format'; format: Format }
  | { kind: 'rotate'; degrees: 90 | 180 | 270 }
  | { kind: 'flip'; axis: 'h' | 'v' }
  | { kind: 'grayscale' }
  | { kind: 'brightness'; delta: number }
  | { kind: 'contrast'; delta: number }
  | { kind: 'white_bg' }
  | { kind: 'crop'; rect?: { x: number; y: number; w: number; h: number }; aspect?: number }
  | { kind: 'signature_clean'; threshold: number }
  | { kind: 'overlay_text'; text: string }

export interface Targets {
  widthPx?: number
  heightPx?: number
  minKb?: number
  maxKb?: number
  format?: Format
}

export type SlotId = 'photo' | 'signature' | 'thumb'
export type TabId = SlotId

export interface ProcessedResult {
  canvas: HTMLCanvasElement
  width: number
  height: number
  blob?: Blob
  kb?: number
  format?: Format
}

export interface Slot {
  id: SlotId
  fileName?: string
  fileSize?: number
  original?: ImageBitmap
  originalWidth?: number
  originalHeight?: number
  ops: Intent[]
  history: Intent[][]
  redoStack?: Intent[][]
  targets: Targets
  result?: ProcessedResult
}

export interface ActivityLogEntry {
  id: string
  time: string
  message: string
  type: 'info' | 'success' | 'warn' | 'error'
}

export interface AppSettings {
  kbBase: 1024 | 1000
  dpi: number
  safetyMargin: number
}

export interface Preset {
  name: string
  targets: Targets
}

export interface AppState {
  slots: Record<SlotId, Slot>
  activeSlot: SlotId
  settings: AppSettings
  presets: Preset[]
  activityLog: ActivityLogEntry[]
}
