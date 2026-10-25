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
import { cmToPx } from '../lib/units'

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
      /** Merges new intents from parser into slot ops (chips as source of truth) */
      type: 'APPLY_PARSED_INTENTS'
      slotId?: SlotId
      intents: Intent[]
      label?: string
    }
  | {
      type: 'UPDATE_CHIP'
      slotId?: SlotId
      index: number
      intent: Intent
    }
  | {
      type: 'REMOVE_CHIP'
      slotId?: SlotId
      index: number
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
      type: 'RESET_SLOT'
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
      case 'rotate':      return `Rotated ${op.degrees}°`
      case 'flip':        return `Flipped ${op.axis === 'h' ? 'horizontal' : 'vertical'}`
      case 'resize_px':   return `Resized to ${op.width}×${op.height} px`
      case 'resize_cm':   return `Resized to ${op.widthCm}×${op.heightCm} cm`
      case 'max_kb':      return `Max ${op.kb} KB`
      case 'min_kb':      return `Min ${op.kb} KB`
      case 'format':      return `Format: ${op.format.toUpperCase()}`
      case 'grayscale':   return 'Grayscale'
      case 'white_bg':    return 'White background'
      case 'brightness':  return `Brightness ${op.delta > 0 ? '+' : ''}${op.delta}`
      case 'contrast':    return `Contrast ${op.delta > 0 ? '+' : ''}${op.delta}`
      case 'crop':        return op.aspect ? `Cropped to aspect ${op.aspect.toFixed(2)}` : 'Cropped'
      default:            return op.kind
    }
  })
  return desc.join(', ')
}

/** Singleton intent kinds — at most one per slot at a time */
const SINGLETON_KINDS = new Set([
  'resize_px', 'resize_cm', 'max_kb', 'min_kb', 'format', 'grayscale', 'white_bg',
])

function singletonKey(kind: string): string {
  // resize_px and resize_cm share the same slot
  if (kind === 'resize_px' || kind === 'resize_cm') return '__resize__'
  return kind
}

/**
 * Merges incoming intents into the existing ops array.
 * - Singleton kinds replace existing ones of the same category.
 * - Additive/transform kinds (rotate, flip, brightness, contrast) append/combine.
 * Returns the new ops array.
 */
function mergeIntents(existing: Intent[], incoming: Intent[]): Intent[] {
  let result = [...existing]
  for (const intent of incoming) {
    const key = singletonKey(intent.kind)
    if (SINGLETON_KINDS.has(intent.kind)) {
      // Remove existing op of the same singleton key
      result = result.filter(op => singletonKey(op.kind) !== key)
      result.push(intent)
    } else {
      // Additive: rotate, flip, brightness, contrast — just append
      // (pipeline accumulates them)
      result.push(intent)
    }
  }
  return result
}

/**
 * Derives Targets from the current ops list.
 * This keeps chips as the single source of truth (spec § 4.1 M4).
 */
export function deriveTargets(ops: Intent[], dpi = 300): Targets {
  const targets: Targets = {}
  for (const op of ops) {
    switch (op.kind) {
      case 'resize_px':
        targets.widthPx = op.width
        targets.heightPx = op.height
        break
      case 'resize_cm':
        targets.widthPx = cmToPx(op.widthCm, op.dpi ?? dpi)
        targets.heightPx = cmToPx(op.heightCm, op.dpi ?? dpi)
        break
      case 'max_kb':
        targets.maxKb = op.kb
        break
      case 'min_kb':
        targets.minKb = op.kb
        break
      case 'format':
        targets.format = op.format
        break
    }
  }
  return targets
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
        targets: {},
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
        targets: deriveTargets(newOps, state.settings.dpi),
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

    case 'APPLY_PARSED_INTENTS': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]

      if (!slot.original) {
        return {
          ...state,
          activityLog: appendLog(
            state.activityLog,
            'No image loaded. Drop or upload an image first.',
            'warn'
          ),
        }
      }

      const newHistory = [...slot.history, slot.ops]
      const newOps = mergeIntents(slot.ops, action.intents)

      const updatedSlot: Slot = {
        ...slot,
        ops: newOps,
        history: newHistory,
        redoStack: [],
        isProcessing: true,
        targets: deriveTargets(newOps, state.settings.dpi),
      }

      const label = action.label || `Command applied: ${describeOps(action.intents)}`

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(state.activityLog, label, 'info'),
      }
    }

    case 'UPDATE_CHIP': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]
      const newHistory = [...slot.history, slot.ops]
      const newOps = slot.ops.map((op, i) => (i === action.index ? action.intent : op))

      const updatedSlot: Slot = {
        ...slot,
        ops: newOps,
        history: newHistory,
        redoStack: [],
        isProcessing: true,
        targets: deriveTargets(newOps, state.settings.dpi),
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(
          state.activityLog,
          `Edited chip: ${describeOps([action.intent])}`,
          'info'
        ),
      }
    }

    case 'REMOVE_CHIP': {
      const targetSlotId = action.slotId || state.activeSlot
      const slot = state.slots[targetSlotId]
      const removed = slot.ops[action.index]
      const newHistory = [...slot.history, slot.ops]
      const newOps = slot.ops.filter((_, i) => i !== action.index)

      const updatedSlot: Slot = {
        ...slot,
        ops: newOps,
        history: newHistory,
        redoStack: [],
        isProcessing: true,
        targets: deriveTargets(newOps, state.settings.dpi),
      }

      return {
        ...state,
        slots: {
          ...state.slots,
          [targetSlotId]: updatedSlot,
        },
        activityLog: appendLog(
          state.activityLog,
          `Removed: ${removed ? describeOps([removed]) : 'chip'}`,
          'info'
        ),
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
        targets: deriveTargets(previousOps, state.settings.dpi),
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
        targets: deriveTargets(nextOps, state.settings.dpi),
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

    case 'RESET':
    case 'RESET_SLOT': {
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
        targets: {},
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
