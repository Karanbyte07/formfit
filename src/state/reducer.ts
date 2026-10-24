import type {
  AppState,
  Slot,
  SlotId,
  Intent,
  Targets,
  AppSettings,
  ProcessedResult,
  ActivityLogEntry,
} from '../types'
import { closeBitmap } from '../lib/image/load'

export type AppAction =
  | {
      type: 'LOAD_FILE_SUCCESS'
      slotId?: SlotId
      fileName: string
      fileSize: number
      bitmap: ImageBitmap
      wasDownscaled?: boolean
    }
  | {
      type: 'SET_ACTIVE_SLOT'
      slotId: SlotId
    }
  | {
      type: 'SET_TARGETS'
      slotId?: SlotId
      targets: Partial<Targets>
    }
  | {
      type: 'SET_SETTINGS'
      settings: Partial<AppSettings>
    }
  | {
      type: 'APPLY_OPS'
      slotId?: SlotId
      ops: Intent[]
      label?: string
    }
  | {
      type: 'UNDO'
      slotId?: SlotId
    }
  | {
      type: 'REDO'
      slotId?: SlotId
    }
  | {
      type: 'RESET'
      slotId?: SlotId
    }
  | {
      type: 'CLEAR_SLOT'
      slotId?: SlotId
    }
  | {
      type: 'SET_PROCESSING'
      slotId?: SlotId
      isProcessing: boolean
    }
  | {
      type: 'SET_PROCESSED_RESULT'
      slotId?: SlotId
      result: ProcessedResult
      logMessage?: string
      logType?: ActivityLogEntry['type']
    }
  | {
      type: 'LOG_MESSAGE'
      message: string
      logType?: 'info' | 'success' | 'warn' | 'error'
    }

export function getCurrentTime(): string {
  const now = new Date()
  return now.toTimeString().split(' ')[0]
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function createEmptySlot(id: SlotId): Slot {
  return {
    id,
    fileName: undefined,
    fileSize: undefined,
    original: undefined,
    originalWidth: undefined,
    originalHeight: undefined,
    ops: [],
    history: [],
    redoStack: [],
    targets: {},
    result: undefined,
    isProcessing: false,
  }
}

function describeOps(ops: Intent[]): string {
  if (ops.length === 0) return 'No operations'
  const desc = ops.map(op => {
    switch (op.kind) {
      case 'rotate':
        return `Rotated ${op.degrees}°`
      case 'flip':
        return `Flipped ${op.axis === 'h' ? 'horizontal' : 'vertical'}`
      case 'resize_px':
        return `Resized to ${op.width}×${op.height} px`
      case 'crop':
        return op.aspect ? `Cropped to aspect ${op.aspect.toFixed(2)}` : 'Cropped'
      default:
        return op.kind
    }
  })
  return desc.join(', ')
}

export const INITIAL_STATE: AppState = {
  slots: {
    photo: createEmptySlot('photo'),
    signature: createEmptySlot('signature'),
    thumb: createEmptySlot('thumb'),
  },
  activeSlot: 'photo',
  settings: {
    kbBase: 1024,
    dpi: 300,
    safetyMargin: 0.97,
  },
  presets: [],
  activityLog: [
    {
      id: 'init-1',
      time: getCurrentTime(),
      message: 'FormFit initialized · Ready for photo or signature',
      type: 'info',
    },
  ],
}

function appendLog(
  log: ActivityLogEntry[],
  message: string,
  type: ActivityLogEntry['type'] = 'info'
): ActivityLogEntry[] {
  const newEntry: ActivityLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: getCurrentTime(),
    message,
    type,
  }
  // Keep last 40 entries
  return [newEntry, ...log].slice(0, 40)
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_SLOT': {
      if (state.activeSlot === action.slotId) return state
      return {
        ...state,
        activeSlot: action.slotId,
      }
    }

    case 'SET_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
      }
    }

    case 'SET_TARGETS': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      const updatedTargets: Targets = {
        ...slot.targets,
        ...action.targets,
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: {
            ...slot,
            targets: updatedTargets,
          },
        },
      }
    }

    case 'LOAD_FILE_SUCCESS': {
      const targetSlotId = action.slotId || state.activeSlot
      const prevSlot = state.slots[targetSlotId]

      // Close previous bitmap if one existed
      if (prevSlot.original) {
        closeBitmap(prevSlot.original)
      }

      const updatedSlot: Slot = {
        ...prevSlot,
        fileName: action.fileName,
        fileSize: action.fileSize,
        original: action.bitmap,
        originalWidth: action.bitmap.width,
        originalHeight: action.bitmap.height,
        ops: [],
        history: [],
        redoStack: [],
        result: undefined,
        isProcessing: true,
      }

      const logMsg = action.wasDownscaled
        ? `Loaded ${action.fileName} (${formatBytes(action.fileSize)}) · Downscaled to 4000px working copy`
        : `Loaded ${action.fileName} (${formatBytes(action.fileSize)}) · ${action.bitmap.width}×${action.bitmap.height} px`

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(state.activityLog, logMsg, 'success'),
      }
    }

    case 'APPLY_OPS': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      if (!slot.original) {
        return {
          ...state,
          activityLog: appendLog(
            state.activityLog,
            `Cannot apply operations: no image loaded in ${targetSlotId} slot.`,
            'warn'
          ),
        }
      }

      const newHistory = [...slot.history, slot.ops]
      const newOps = [...slot.ops, ...action.ops]

      const updatedSlot: Slot = {
        ...slot,
        ops: newOps,
        history: newHistory,
        redoStack: [],
        isProcessing: true,
      }

      const label = action.label || describeOps(action.ops)

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(state.activityLog, label, 'info'),
      }
    }

    case 'UNDO': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      if (!slot.original || slot.history.length === 0) {
        return state
      }

      const previousOps = slot.history[slot.history.length - 1]
      const newHistory = slot.history.slice(0, -1)
      const newRedoStack = [...(slot.redoStack || []), slot.ops]

      const updatedSlot: Slot = {
        ...slot,
        ops: previousOps,
        history: newHistory,
        redoStack: newRedoStack,
        isProcessing: true,
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(state.activityLog, 'Undo applied', 'info'),
      }
    }

    case 'REDO': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      if (!slot.original || !slot.redoStack || slot.redoStack.length === 0) {
        return state
      }

      const nextOps = slot.redoStack[slot.redoStack.length - 1]
      const newRedoStack = slot.redoStack.slice(0, -1)
      const newHistory = [...slot.history, slot.ops]

      const updatedSlot: Slot = {
        ...slot,
        ops: nextOps,
        history: newHistory,
        redoStack: newRedoStack,
        isProcessing: true,
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(state.activityLog, 'Redo applied', 'info'),
      }
    }

    case 'RESET': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      if (!slot.original || slot.ops.length === 0) {
        return state
      }

      const newHistory = [...slot.history, slot.ops]

      const updatedSlot: Slot = {
        ...slot,
        ops: [],
        history: newHistory,
        redoStack: [],
        isProcessing: true,
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(
          state.activityLog,
          `Reset all changes for ${targetSlotId}`,
          'info'
        ),
      }
    }

    case 'CLEAR_SLOT': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      if (slot.original) {
        closeBitmap(slot.original)
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: createEmptySlot(targetSlotId),
        },
        activityLog: appendLog(
          state.activityLog,
          `Cleared ${targetSlotId} slot`,
          'info'
        ),
      }
    }

    case 'SET_PROCESSING': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: {
            ...slot,
            isProcessing: action.isProcessing,
          },
        },
      }
    }

    case 'SET_PROCESSED_RESULT': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      let log = state.activityLog
      if (action.logMessage) {
        log = appendLog(log, action.logMessage, action.logType || 'success')
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: {
            ...slot,
            result: action.result,
            isProcessing: false,
          },
        },
        activityLog: log,
      }
    }

    case 'LOG_MESSAGE': {
      return {
        ...state,
        activityLog: appendLog(state.activityLog, action.message, action.logType || 'info'),
      }
    }

    default:
      return state
  }
}
