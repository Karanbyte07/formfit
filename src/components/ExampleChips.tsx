interface ExampleChipsProps {
  onRunCommand: (cmd: string) => void
}

const EXAMPLE_CHIPS = [
  { id: 'chip-200x230', label: '200 x 230 px, 50 KB se kam, JPG' },
  { id: 'chip-cm', label: '3.5 x 4.5 cm, 20 se 50 KB' },
  { id: 'chip-rotate-bg', label: '90 degree ghuma do aur background safed karo' },
  { id: 'chip-grayscale', label: 'grayscale karo aur thoda bright karo' },
]

export default function ExampleChips({ onRunCommand }: ExampleChipsProps) {
  return (
    <div className="space-y-1.5 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        Try saying
      </p>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_CHIPS.map(chip => (
          <button
            key={chip.id}
            id={chip.id}
            className="chip py-1 px-2.5 text-xs text-left"
            onClick={() => onRunCommand(chip.label)}
            title={`Click to run: ${chip.label}`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}
