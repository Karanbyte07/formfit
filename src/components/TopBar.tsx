import type { TabId } from '../types'

interface TopBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  fileName: string
  fileSize: string
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'signature', label: 'Signature' },
  { id: 'thumb', label: 'Thumb' },
]

export default function TopBar({ activeTab, onTabChange, fileName, fileSize }: TopBarProps) {
  return (
    <header
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      className="flex items-center gap-3 px-4 py-2 flex-wrap"
    >
      {/* Logo + brand */}
      <div className="flex items-center gap-2 mr-2 flex-shrink-0">
        <LogoMark />
        <span
          style={{ color: 'var(--color-text)' }}
          className="text-base font-bold tracking-tight"
        >
          FormFit
        </span>
      </div>

      {/* Tab switcher */}
      <nav
        className="flex items-center gap-1 rounded-lg p-1 flex-shrink-0"
        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
        aria-label="Image type tabs"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
            className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-150"
            style={
              activeTab === tab.id
                ? {
                    background: 'var(--color-accent)',
                    color: '#fff',
                    boxShadow: 'var(--shadow-sm)',
                  }
                : {
                    color: 'var(--color-muted)',
                  }
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* File badge — hidden when no file is loaded (fileName is '') */}
      {fileName && fileSize && (
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium flex-shrink-0"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          <span style={{ color: 'var(--color-text)' }} className="font-semibold">
            {fileName}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
            }}
          >
            {fileSize}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button id="btn-upload" className="btn-secondary text-sm py-1.5 px-3">
          ↑ Upload
        </button>
        <button id="btn-undo" className="btn-secondary text-sm py-1.5 px-3">
          ↩ Undo
        </button>
        <button id="btn-download" className="btn-primary text-sm py-1.5 px-3">
          ↓ Download
        </button>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0F766E" />
      <rect x="8" y="8" width="10" height="14" rx="2" fill="white" opacity="0.85" />
      <rect x="14" y="12" width="10" height="12" rx="2" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.5" />
      <circle cx="19" cy="17" r="2.5" fill="#0F766E" />
      <line x1="17" y1="21.5" x2="21" y2="21.5" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
