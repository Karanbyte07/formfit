import { Mic, ArrowRight } from 'lucide-react'

export default function CommandBox() {
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
          {/* Mic icon – decorative only */}
          <button
            id="btn-mic"
            aria-label="Voice input (decorative)"
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
          >
            <Mic size={18} />
          </button>

          <textarea
            id="command-input"
            rows={2}
            className="flex-1 w-full bg-transparent resize-none text-sm outline-none leading-snug"
            style={{ color: 'var(--color-text)', minHeight: '3rem' }}
            placeholder="Bolo ya type karo, jaise: 200x230 px, 50 KB se kam, JPG"
            aria-label="Command input"
          />
        </div>

        {/* Row 2: Go button pinned right */}
        <div className="flex justify-end">
          <button
            id="btn-go"
            className="btn-primary py-1.5 px-4"
            aria-label="Run command"
          >
            Go <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
        Apni Wispr key dabao, bolo, chhodo. Apne aap chalega.
      </p>
    </div>
  )
}
