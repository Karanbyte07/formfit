export type Format = 'jpeg' | 'png' | 'webp'

export type EncodeStatus =
  | 'met'
  | 'best_effort'
  | 'below_min'
  | 'png_kb_unsupported'
  | 'failed'

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
  | { kind: 'overlay_text'; text: string; date?: string }
  | { kind: 'undo' }
  | { kind: 'reset' }
  | { kind: 'download' }

export interface Targets {
  widthPx?: number
  heightPx?: number
  minKb?: number
  maxKb?: number
  format?: Format
}

export type SlotId = 'photo' | 'signature' | 'thumb'
export type TabId = SlotId

export interface MeasuredResult {
  width: number
  height: number
  bytes: number
  mime: string
}

export interface ProcessedResult {
  ok: boolean
  canvas: HTMLCanvasElement
  width: number
  height: number
  blob?: Blob | null
  kb?: number
  format?: Format
  quality?: number
  status: EncodeStatus
  message?: string
  measured?: MeasuredResult
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
  isProcessing?: boolean
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
  id: string
  name: string
  targets: Targets
  ops?: Intent[]
  slot?: SlotId
  isDefault?: boolean
}

export interface AppState {
  slots: Record<SlotId, Slot>
  activeSlot: SlotId
  settings: AppSettings
  presets: Preset[]
  activityLog: ActivityLogEntry[]
}
