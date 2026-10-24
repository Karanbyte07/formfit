export function kbToBytes(kb: number, kbBase: 1024 | 1000 = 1024): number {
  return Math.round(kb * kbBase)
}

export function bytesToKb(bytes: number, kbBase: 1024 | 1000 = 1024): number {
  return Number((bytes / kbBase).toFixed(1))
}

export function calculateMaxAllowedBytes(
  maxKb: number,
  kbBase: 1024 | 1000 = 1024,
  safetyMargin: number = 0.97
): number {
  return Math.floor(maxKb * kbBase * safetyMargin)
}

export function formatFileSize(bytes: number, kbBase: 1024 | 1000 = 1024): string {
  if (bytes <= 0) return '0 B'
  if (bytes < kbBase) return `${bytes} B`
  const kb = bytes / kbBase
  if (kb < kbBase) {
    return `${kb.toFixed(1)} KB`
  }
  const mb = kb / kbBase
  return `${mb.toFixed(1)} MB`
}
