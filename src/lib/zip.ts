/**
 * zip.ts — Client-side ZIP creation for application packs (spec § 4.2 S2, § 11.1)
 *
 * Uses fflate for high-performance in-browser compression without server calls.
 */
import { zipSync } from 'fflate'
import type { Slot, SlotId } from '../types'

export async function createSlotsZip(
  slots: Record<SlotId, Slot>
): Promise<Blob> {
  const zipFiles: Record<string, Uint8Array> = {}

  for (const slotId of ['photo', 'signature', 'thumb'] as SlotId[]) {
    const slot = slots[slotId]
    if (slot && slot.result && slot.result.blob) {
      const ext = slot.result.format === 'png' ? 'png' : 'jpg'
      const w = slot.result.width || slot.result.measured?.width || 0
      const h = slot.result.height || slot.result.measured?.height || 0
      const filename = `formfit-${slotId}-${w}x${h}.${ext}`

      const buffer = await slot.result.blob.arrayBuffer()
      zipFiles[filename] = new Uint8Array(buffer)
    }
  }

  const zipped = zipSync(zipFiles)
  return new Blob([zipped as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
