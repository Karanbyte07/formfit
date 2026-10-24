import { Lock } from 'lucide-react'

export default function PrivacyBadge() {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs shrink-0"
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-muted)',
      }}
    >
      <Lock size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
      <span>Aapki photo is browser se bahar nahi jaati</span>
    </div>
  )
}
