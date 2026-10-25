import { useCallback } from 'react'
import { useApp } from '../../state/context'
import { loadImageFile } from './load'
import { generateSampleImageFile } from './sample'
import type { SlotId } from '../../types'

export function useImageLoader() {
  const { state, dispatch } = useApp()
  const activeSlot = state.activeSlot

  const loadFile = useCallback(
    async (file: File, targetSlot?: SlotId) => {
      if (!file) return

      const slotId = targetSlot || activeSlot
      const res = await loadImageFile(file)
      if (res.ok) {
        dispatch({
          type: 'LOAD_FILE_SUCCESS',
          slotId,
          fileName: res.fileName,
          fileSize: res.fileSize,
          bitmap: res.bitmap,
          wasDownscaled: res.wasDownscaled,
        })
      } else {
        dispatch({
          type: 'LOG_MESSAGE',
          message: res.message,
          logType: 'error',
        })
      }
    },
    [activeSlot, dispatch]
  )

  const loadSample = useCallback(
    async (targetSlot?: SlotId) => {
      const slotId = targetSlot || activeSlot
      const label =
        slotId === 'signature'
          ? 'synthetic handwritten signature'
          : slotId === 'thumb'
          ? 'synthetic thumbprint impression'
          : 'synthetic portrait photo'

      dispatch({
        type: 'LOG_MESSAGE',
        message: `Generating ${label}...`,
        logType: 'info',
      })

      try {
        const sampleFile = await generateSampleImageFile(slotId)
        await loadFile(sampleFile, slotId)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        dispatch({
          type: 'LOG_MESSAGE',
          message: `Failed to generate sample: ${msg}`,
          logType: 'error',
        })
      }
    },
    [activeSlot, dispatch, loadFile]
  )

  return { loadFile, loadSample }
}
