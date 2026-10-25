import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, ArrowRight, Loader2 } from 'lucide-react'
import { parseCommand } from '../lib/parser/parse'
import { useApp, useActiveSlot } from '../state/context'

interface CommandBarProps {
  onFillCommand?: (cmd: string) => void
  filledCommand?: string
}

const PLACEHOLDERS = [
  '200 by 230 pixel karo, 50 KB se kam, JPG mein',
  '3.5 x 4.5 cm, 20 se 50 KB, JPEG',
  '90 degree ghuma do, background safed karo',
  'grayscale karo aur thoda bright karo',
  'under 50 kb, jpg format',
  'pachaas kb se kam karo, jpeg mein',
]

export default function CommandBar({ onFillCommand, filledCommand }: CommandBarProps) {
  const { state, dispatch } = useApp()
  const activeSlot = useActiveSlot()
  const [value, setValue] = useState('')
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [lastUnknown, setLastUnknown] = useState<string[]>([])
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate placeholder every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Handle filled command from ExampleChips
  useEffect(() => {
    if (filledCommand) {
      setValue(filledCommand)
      setTimeout(() => runCommand(filledCommand), 0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCommand])

  const runCommand = useCallback((cmd: string) => {
    const raw = cmd.trim()
    if (!raw) return

    const result = parseCommand(raw, { defaultDpi: state.settings.dpi })

    // Handle meta intents first
    const metaKinds = new Set(['undo', 'reset', 'download'])
    const metaIntents = result.intents.filter(i => metaKinds.has(i.kind))
    const normalIntents = result.intents.filter(i => !metaKinds.has(i.kind))

    for (const meta of metaIntents) {
      if (meta.kind === 'undo') {
        dispatch({ type: 'UNDO', slotId: activeSlot.id })
      } else if (meta.kind === 'reset') {
        dispatch({ type: 'RESET_SLOT', slotId: activeSlot.id })
      } else if (meta.kind === 'download') {
        // Trigger download if result exists
        const blob = activeSlot.result?.blob
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const ext = activeSlot.result?.format === 'png' ? 'png' : 'jpg'
          a.download = `formfit-${activeSlot.id}.${ext}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }
    }

    if (normalIntents.length > 0) {
      // Warn about conflicts
      for (const w of result.warnings) {
        dispatch({ type: 'LOG_MESSAGE', message: `⚠️ ${w}`, logType: 'warn' })
      }

      dispatch({
        type: 'APPLY_PARSED_INTENTS',
        slotId: activeSlot.id,
        intents: normalIntents,
        label: `Command: "${raw.slice(0, 60)}${raw.length > 60 ? '…' : ''}"`,
      })

      // Clear on success
      setValue('')
      setLastUnknown(result.unknown)
    } else if (metaIntents.length === 0) {
      // Nothing understood
      setLastUnknown(result.unknown.length > 0 ? result.unknown : [raw])
      dispatch({
        type: 'LOG_MESSAGE',
        message: `Couldn't understand: "${raw.slice(0, 60)}"`,
        logType: 'warn',
      })
    } else {
      // Only meta intents
      setValue('')
      setLastUnknown([])
    }
  }, [activeSlot.id, activeSlot.result, dispatch, state.settings.dpi])

  // Expose runCommand for external fill
  if (onFillCommand) {
    // onFillCommand is a ref-setter pattern; we handle in useEffect above
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value
    setValue(newVal)
    setLastUnknown([])

    // Clear existing debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    // 800ms auto-run on pause (Wispr Flow dictation pattern)
    if (newVal.trim()) {
      setIsAutoRunning(false)
      debounceTimer.current = setTimeout(() => {
        const parsed = parseCommand(newVal, { defaultDpi: state.settings.dpi })
        const validNormal = parsed.intents.filter(i => !['undo','reset','download'].includes(i.kind))
        // Auto-run if at least 1 valid intent found
        if (validNormal.length > 0 || parsed.intents.length > 0) {
          setIsAutoRunning(true)
          runCommand(newVal)
          setIsAutoRunning(false)
        }
      }, 800)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      runCommand(value)
    }
  }

  const handleGoClick = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    runCommand(value)
  }

  return (
    <div className="space-y-1.5 shrink-0">
      <div
        className="rounded-xl px-3 py-2 space-y-1.5"
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
        onFocusCapture={e => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-accent)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(15,118,110,0.15)'
        }}
        onBlurCapture={e => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
        }}
      >
        {/* Row 1: mic + full-width textarea */}
        <div className="flex items-start gap-2">
          {/* Mic icon – decorative only, hint for Wispr */}
          <button
            id="btn-mic"
            aria-label="Voice input hint (use Wispr Flow)"
            className="flex-shrink-0 p-1.5 rounded-lg transition-colors duration-150 mt-0.5"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'
            }}
            tabIndex={-1}
            title="Hold your Wispr key and speak"
          >
            <Mic size={18} />
          </button>

          <textarea
            id="command-input"
            ref={textareaRef}
            rows={2}
            className="flex-1 w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 shadow-none resize-none text-sm leading-snug"
            style={{ color: 'var(--color-text)', minHeight: '3rem', border: 'none', outline: 'none', boxShadow: 'none' }}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            aria-label="Command input — type or dictate your requirements"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {/* Row 2: Go button pinned right */}
        <div className="flex items-center justify-between">
          {isAutoRunning && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              <Loader2 size={12} className="animate-spin" /> Running…
            </span>
          )}
          {!isAutoRunning && <span />}
          <button
            id="btn-go"
            className="btn-primary py-1.5 px-4"
            aria-label="Run command"
            onClick={handleGoClick}
          >
            Go <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Apni Wispr key dabao, bolo, chhodo. Apne aap chalega.
      </p>

      {/* Unknown text helper */}
      {lastUnknown.length > 0 && (
        <div
          className="rounded-lg px-3 py-2 text-xs space-y-1"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          <p>
            Couldn't understand:{' '}
            <span style={{ color: 'var(--color-text)', fontStyle: 'italic' }}>
              "{lastUnknown.join('; ')}"
            </span>
          </p>
          <p>
            Try:{' '}
            {[
              '50 KB se kam',
              '200 by 230 pixel',
              'jpeg mein',
            ].map(example => (
              <button
                key={example}
                className="underline mr-2"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => {
                  setValue(example)
                  runCommand(example)
                }}
              >
                "{example}"
              </button>
            ))}
          </p>
        </div>
      )}
    </div>
  )
}
