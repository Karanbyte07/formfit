import { describe, it, expect } from 'vitest'
import { createSlotsZip } from '../src/lib/zip'
import type { Slot, SlotId } from '../src/types'

function createMockSlot(id: SlotId, width: number, height: number, sizeBytes: number): Slot {
  const dummyBuffer = new Uint8Array(sizeBytes)
  const blob = new Blob([dummyBuffer], { type: 'image/jpeg' })
  return {
    id,
    fileName: `${id}.jpg`,
    fileSize: sizeBytes,
    original: undefined,
    ops: [],
    history: [],
    redoStack: [],
    targets: {},
    isProcessing: false,
    result: {
      ok: true,
      canvas: {} as HTMLCanvasElement,
      width,
      height,
      blob,
      kb: Math.round(sizeBytes / 1024),
      format: 'jpeg',
      status: 'met',
      measured: {
        width,
        height,
        bytes: sizeBytes,
        mime: 'image/jpeg',
      },
    },
  }
}

describe('createSlotsZip', () => {
  it('creates a non-empty ZIP blob when slots have results', async () => {
    const slots: Record<SlotId, Slot> = {
      photo: createMockSlot('photo', 200, 230, 40000),
      signature: createMockSlot('signature', 140, 60, 15000),
      thumb: {
        id: 'thumb',
        ops: [],
        history: [],
        redoStack: [],
        targets: {},
        isProcessing: false,
      },
    }

    const zipBlob = await createSlotsZip(slots)
    expect(zipBlob).toBeDefined()
    expect(zipBlob.type).toBe('application/zip')
    expect(zipBlob.size).toBeGreaterThan(0)
  })
})
