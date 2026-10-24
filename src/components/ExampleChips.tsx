const EXAMPLE_CHIPS = [
  '200 x 230 px, under 50 KB, JPG',
  '50 kb se kam karo',
  'Rotate 90 aur white background',
  'Chhota karo',
  'Undo',
]

export default function ExampleChips() {
  return (
    <div className="space-y-1.5 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        Try saying
      </p>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_CHIPS.map(chip => (
          <button
            key={chip}
            id={`chip-example-${chip.slice(0, 12).replace(/\s/g, '-').toLowerCase()}`}
            className="chip py-1 px-2.5 text-xs"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
