import { ImageIcon, Sparkles } from 'lucide-react'

export default function PreviewPanel() {
  return (
    <div
      className="flex-1 flex flex-col min-h-0 p-4"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Drop zone */}
      <div
        id="drop-zone"
        className="flex-1 flex flex-col items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer group min-h-64"
        style={{
          border: '2px dashed var(--color-border)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-sm)',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-accent)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--color-accent-soft)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)'
        }}
        role="button"
        aria-label="Drop zone for photo or signature upload"
        tabIndex={0}
      >
        {/* Decorative icon cluster */}
        <div className="relative mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{ background: 'var(--color-accent-soft)', border: '1.5px solid var(--color-border)' }}
          >
            <ImageIcon size={36} style={{ color: 'var(--color-accent)' }} />
          </div>
          <span
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Sparkles size={14} />
          </span>
        </div>

        <p
          className="text-lg font-semibold mb-1 text-center px-4"
          style={{ color: 'var(--color-text)' }}
        >
          Drop your photo or signature here
        </p>
        <p className="text-sm mb-6 text-center px-4" style={{ color: 'var(--color-muted)' }}>
          JPG, PNG or WebP · up to 20 MB
        </p>

        <div className="flex gap-3 flex-wrap justify-center px-4">
          <button id="btn-browse" className="btn-primary">
            Browse file
          </button>
          <button
            id="btn-try-sample"
            className="btn-secondary"
          >
            Try sample
          </button>
        </div>
      </div>
    </div>
  )
}
