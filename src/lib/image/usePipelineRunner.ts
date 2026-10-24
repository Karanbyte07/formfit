import { useEffect, useRef } from 'react'
import { useApp } from '../../state/context'
import { applyPipeline } from './pipeline'
import { encodeToTarget } from './encode'
import { verifyResult } from './verify'
import type { ActivityLogEntry } from '../../types'

export function usePipelineRunner() {
  const { state, dispatch } = useApp()
  const activeSlot = state.slots[state.activeSlot]
  const settings = state.settings

  const latestRunId = useRef(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!activeSlot.original) {
      return
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    const runId = ++latestRunId.current

    debounceTimer.current = setTimeout(async () => {
      try {
        dispatch({
          type: 'SET_PROCESSING',
          slotId: activeSlot.id,
          isProcessing: true,
        })

        // 1. Non-destructive pipeline execution (Orientation -> Crop -> Resize -> Color)
        const pipelineRes = applyPipeline(activeSlot.original!, activeSlot.ops, activeSlot.targets)

        // Stale check
        if (latestRunId.current !== runId) return

        // 2. Encode to targets (binary search on quality, white BG for JPEG, PNG check)
        const encodeRes = await encodeToTarget(pipelineRes.canvas, activeSlot.targets, settings)

        // Stale check
        if (latestRunId.current !== runId) return

        // 3. Verification of final blob (measured width, height, bytes)
        let measured = undefined
        if (encodeRes.blob) {
          measured = await verifyResult(encodeRes.blob)
        }

        // Stale check
        if (latestRunId.current !== runId) return

        // 4. Determine log message and type
        let logMessage: string | undefined = undefined
        let logType: ActivityLogEntry['type'] = 'success'

        if (encodeRes.status === 'met') {
          logMessage = `Compressed to ${encodeRes.kb} KB (quality ${encodeRes.quality.toFixed(2)}), ${encodeRes.width} × ${encodeRes.height} px, ${encodeRes.format.toUpperCase()}`
          logType = 'success'
        } else if (encodeRes.status === 'best_effort') {
          logMessage = `Best effort: ${encodeRes.message}`
          logType = 'warn'
        } else if (encodeRes.status === 'below_min') {
          logMessage = encodeRes.message
          logType = 'warn'
        } else if (encodeRes.status === 'png_kb_unsupported') {
          logMessage = encodeRes.message
          logType = 'warn'
        } else if (encodeRes.status === 'failed') {
          logMessage = encodeRes.message
          logType = 'error'
        }

        dispatch({
          type: 'SET_PROCESSED_RESULT',
          slotId: activeSlot.id,
          result: {
            ...encodeRes,
            measured,
          },
          logMessage,
          logType,
        })
      } catch (err: unknown) {
        if (latestRunId.current !== runId) return
        const msg = err instanceof Error ? err.message : 'Processing error'
        dispatch({
          type: 'LOG_MESSAGE',
          message: `Pipeline error: ${msg}`,
          logType: 'error',
        })
        dispatch({
          type: 'SET_PROCESSING',
          slotId: activeSlot.id,
          isProcessing: false,
        })
      }
    }, 250)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [
    activeSlot.id,
    activeSlot.original,
    activeSlot.ops,
    activeSlot.targets,
    settings.kbBase,
    settings.safetyMargin,
    dispatch,
  ])
}
