/**
 * parse.ts — main entry point for the command parser (spec § 7.1 – 7.5)
 *
 * NEVER throws. Returns { intents, unknown, confidence, warnings }.
 */
import type { Intent } from '../../types'
import { normalize } from './normalize'
import { RULES, FILLER_WORDS } from './intents'

export interface ParseResult {
  intents: Intent[]
  unknown: string[]
  confidence: number
  warnings: string[]
}

export interface ParseOptions {
  defaultDpi?: number
}

/** Clause splitters: commas, semicolons, unambiguous dots, conjunctions */
const CLAUSE_SPLITTERS = /,|;|(?<!\d)\.(?!\d)|(?<!\b(?:name|naam))\s+(?:and|aur|then|phir|also|aur\s+fir|fir|plus|ke\s+saath|saath\s+me|saath\s+mein)\s+(?!\bdate\b)/

/** Singleton intent kinds — later wins */
const SINGLETON_KINDS = new Set([
  'resize_px', 'resize_cm', 'max_kb', 'min_kb', 'format', 'grayscale', 'white_bg',
  'signature_clean', 'overlay_text',
])

/** Friendly description of an intent for conflict warnings */
function describeIntent(intent: Intent): string {
  switch (intent.kind) {
    case 'resize_px':       return `${intent.width}×${intent.height} px`
    case 'resize_cm':       return `${intent.widthCm}×${intent.heightCm} cm`
    case 'max_kb':          return `${intent.kb} KB max`
    case 'min_kb':          return `${intent.kb} KB min`
    case 'format':          return intent.format.toUpperCase()
    case 'grayscale':       return 'grayscale'
    case 'white_bg':        return 'white background'
    case 'signature_clean': return `clean signature (th: ${intent.threshold})`
    case 'overlay_text':    return 'name & date strip'
    default:                return intent.kind
  }
}

/** Merge resize kinds together — resize_px and resize_cm share a singleton bucket */
function resizeKindKey(kind: string): string {
  if (kind === 'resize_px' || kind === 'resize_cm') return '__resize__'
  return kind
}

/** Try to match a single clause against all rules. Returns matched intents and leftover text. */
function parseClause(clause: string): { matched: Intent[]; leftover: string } {
  const matched: Intent[] = []
  let remaining = clause.trim()

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      // Use a sticky-compatible approach: test on remaining text
      const m = remaining.match(pattern)
      if (m) {
        const result = rule.extract(m, remaining)
        if (result) {
          const toAdd = Array.isArray(result) ? result : [result]
          matched.push(...toAdd)
          // Remove matched portion from remaining text
          remaining = remaining.replace(pattern, ' ').replace(/\s+/g, ' ').trim()
          break // Move to next rule after first pattern match
        }
      }
    }
  }

  return { matched, leftover: remaining }
}

/** Strip filler words and return cleaned text. Returns empty if only fillers remain. */
function stripFillers(text: string): string {
  return text
    .replace(FILLER_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Is a clause effectively empty after stripping fillers? */
function isMeaningless(text: string): boolean {
  const cleaned = stripFillers(text)
  // Only punctuation / whitespace / very short fragments
  return cleaned.length <= 2 || /^[\s.,;!?]+$/.test(cleaned)
}

/**
 * Main parser entry point.
 * @param raw — raw command string from the user
 * @param opts — options (defaultDpi overrides resize_cm's default 300)
 */
export function parseCommand(raw: string, opts?: ParseOptions): ParseResult {
  const intents: Intent[] = []
  const unknown: string[] = []
  const warnings: string[] = []

  if (!raw || !raw.trim()) {
    return { intents, unknown, confidence: 0, warnings }
  }

  try {
    // Step 1: Normalize
    const normalized = normalize(raw)

    // Step 2: Split into clauses
    const clauses = normalized.split(CLAUSE_SPLITTERS).map(c => c.trim()).filter(Boolean)

    // Step 3: Parse each clause
    const allMatched: Intent[] = []
    for (const clause of clauses) {
      const { matched, leftover } = parseClause(clause)
      allMatched.push(...matched)
      if (leftover && !isMeaningless(leftover)) {
        const cleaned = stripFillers(leftover)
        if (cleaned.length > 2) {
          unknown.push(cleaned)
        }
      }
    }

    // Step 4: Apply DPI override to resize_cm intents
    if (opts?.defaultDpi) {
      for (const intent of allMatched) {
        if (intent.kind === 'resize_cm') {
          intent.dpi = opts.defaultDpi
        }
      }
    }

    // Step 5: Conflict resolution — singleton kinds: later wins
    // Track last-seen per singleton key
    const singletonSeen = new Map<string, { index: number; intent: Intent }>()

    for (let i = 0; i < allMatched.length; i++) {
      const intent = allMatched[i]
      const key = resizeKindKey(intent.kind)

      if (SINGLETON_KINDS.has(intent.kind) || key === '__resize__') {
        const prev = singletonSeen.get(key)
        if (prev) {
          // Later wins — warn
          warnings.push(
            `Used "${describeIntent(intent)}" (replaced earlier "${describeIntent(prev.intent)}")`
          )
          prev.index = i
          prev.intent = intent
        } else {
          singletonSeen.set(key, { index: i, intent })
        }
      }
    }

    // Build final intents list: singletons from last-seen map, others pass through
    const singletonIndices = new Map<string, number>()
    for (const [key, val] of singletonSeen) {
      singletonIndices.set(key, val.index)
    }

    for (let i = 0; i < allMatched.length; i++) {
      const intent = allMatched[i]
      const key = resizeKindKey(intent.kind)
      if (SINGLETON_KINDS.has(intent.kind) || key === '__resize__') {
        // Only emit the last occurrence
        if (singletonIndices.get(key) === i) {
          intents.push(intent)
        }
      } else {
        // Non-singleton (rotate, flip, brightness, contrast, undo, reset, download)
        intents.push(intent)
      }
    }

    // Step 6: Confidence score
    const clauseCount = clauses.length
    const matchedCount = intents.length
    const unknownCount = unknown.length
    const confidence =
      clauseCount === 0
        ? 0
        : Math.max(0, Math.min(1, (matchedCount - unknownCount * 0.5) / Math.max(1, clauseCount)))

    return { intents, unknown, confidence, warnings }
  } catch {
    // Zero-crash policy: any unexpected error returns empty result
    return { intents, unknown, confidence: 0, warnings }
  }
}
