import { useCallback } from 'react'
import { useApp } from '../../state/context'
import { loadImageFile } from './load'
import { generateSampleImageFile } from './sample'

export function useImageLoader() {
  const { dispatch } = useApp()

  const loadFile = useCallback(
    async (file: File) => {
      if (!file) return

      const res = await loadImageFile(file)
      if (res.ok) {
        dispatch({
          type: 'LOAD_FILE_SUCCESS',
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
    [dispatch]
  )

  const loadSample = useCallback(async () => {
    dispatch({
      type: 'LOG_MESSAGE',
      message: 'Generating synthetic sample image (3000×4000 px)...',
      logType: 'info',
    })
    try {
      const sampleFile = await generateSampleImageFile()
      await loadFile(sampleFile)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      dispatch({
        type: 'LOG_MESSAGE',
        message: `Failed to generate sample: ${msg}`,
        logType: 'error',
      })
    }
  }, [dispatch, loadFile])

  return { loadFile, loadSample }
}
