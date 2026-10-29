/**
 * Footer.tsx — Compact onboarding, privacy, and challenge footer (spec § 11.1, § 15)
 */
import { ShieldCheck, HelpCircle, Award } from 'lucide-react'

export default function Footer() {
  return (
    <footer
      className="w-full mt-4 pt-3.5 pb-4 px-4 rounded-xl text-xs space-y-2.5 shrink-0 transition-colors"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)',
      }}
      aria-label="App information and privacy footer"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. How it works */}
        <div className="flex items-start gap-2">
          <HelpCircle size={15} className="shrink-0 mt-0.5 text-teal-700" />
          <div className="space-y-0.5">
            <span
              className="font-bold block text-[11px] uppercase tracking-wide text-slate-900"
              style={{ color: 'var(--color-text)' }}
            >
              How it works
            </span>
            <p className="text-[11px] leading-relaxed text-slate-700">
              1. Drop photo/signature (or paste form notice) → 2. Speak with Wispr Flow or type rules in English/Hinglish → 3. Verify green checklist &amp; download.
            </p>
          </div>
        </div>

        {/* 2. Privacy */}
        <div className="flex items-start gap-2">
          <ShieldCheck size={15} className="shrink-0 mt-0.5 text-emerald-700" />
          <div className="space-y-0.5">
            <span
              className="font-bold block text-[11px] uppercase tracking-wide text-slate-900"
              style={{ color: 'var(--color-text)' }}
            >
              100% Private &amp; Offline
            </span>
            <p className="text-[11px] leading-relaxed text-slate-700">
              Client-side Canvas processing only. Zero uploads, zero servers, enforced via strict <code className="font-mono text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">connect-src &apos;none&apos;</code> CSP.
            </p>
          </div>
        </div>

        {/* 3. Challenge context */}
        <div className="flex items-start gap-2">
          <Award size={15} className="shrink-0 mt-0.5 text-amber-700" />
          <div className="space-y-0.5">
            <span
              className="font-bold block text-[11px] uppercase tracking-wide text-slate-900"
              style={{ color: 'var(--color-text)' }}
            >
              Built for
            </span>
            <p className="text-[11px] leading-relaxed text-slate-700">
              No Hands: The Wispr Challenge (WeMakeDevs × Wispr Flow).
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
