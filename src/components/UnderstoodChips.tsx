import { Check } from 'lucide-react'

interface ParsedChip {
  id: string
  label: string
}

const FAKE_CHIPS: ParsedChip[] = [
  { id: 'understood-resize', label: 'Resize 200×230' },
  { id: 'understood-maxkb', label: 'Max 50 KB' },
  { id: 'understood-format', label: 'JPG' },
]

export default function UnderstoodChips() {
  if (FAKE_CHIPS.length === 0) return null

  return (
    <div className="space-y-1.5 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        I understood
      </p>
      <div className="flex flex-wrap gap-1.5">
        {FAKE_CHIPS.map(chip => (
          <span key={chip.id} id={chip.id} className="chip-result flex items-center gap-1 py-0.5 px-2.5 text-xs">
            <Check size={11} style={{ color: 'var(--color-success)' }} />
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  )
}
