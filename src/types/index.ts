// ── Tab identifiers ───────────────────────────────────────────────────────
export type TabId = 'photo' | 'signature' | 'thumb'

// ── Placeholder types for future image processing ─────────────────────────
export interface ImageFile {
  name: string
  sizeBytes: number
  /** Data URL for preview */
  dataUrl: string
  width: number
  height: number
  mimeType: string
}

export interface ParsedCommand {
  raw: string
  targetWidth?: number
  targetHeight?: number
  maxKB?: number
  format?: 'jpg' | 'png' | 'webp'
  rotate?: number
  background?: string
}

export interface ChecklistItem {
  id: string
  label: string
  expected: string
  status: 'pass' | 'fail' | 'pending'
}

export interface LogEntry {
  id: string
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'warn' | 'error'
}
