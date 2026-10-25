/**
 * extractRules.ts — deterministic notice-paste extractor (spec § 10)
 *
 * Extracts per-slot image specification rules from pasted form instructions.
 * NEVER throws. Returns structured proposals per slot with source snippets.
 */
import type { Intent, SlotId } from '../../types'

export interface NoticeProposal {
  slot: SlotId
  intents: Intent[]
  confidence: number
  sourceSnippet: string
}

export interface NoticeExtractionResult {
  proposals: NoticeProposal[]
  unparsedNotice: boolean
  rawNotice: string
}

export interface ExtractOptions {
  defaultDpi?: number
  activeSlot?: SlotId
}

interface SlotMatch {
  slot: SlotId
  index: number
  length: number
}

const SLOT_PATTERNS: { slot: SlotId; regex: RegExp }[] = [
  {
    slot: 'thumb',
    regex: /(?:^|[\s,.:;।॥([-])(?:left\s+thumb(?:\s+impression)?|thumb(?:\s+impression)?|angutha|अंगूठा)(?:$|[\s,.:;।॥)\]-])/gui,
  },
  {
    slot: 'signature',
    regex: /(?:^|[\s,.:;।॥([-])(?:signatures?|signs?|hastakshar|हस्ताक्षर)(?:$|[\s,.:;।॥)\]-])/gui,
  },
  {
    slot: 'photo',
    regex: /(?:^|[\s,.:;।॥([-])(?:passports?\s+(?:size\s+)?photos?|candidate\s+photos?|photographs?|photos?|pictures?|pics?|tasveer|तस्वीर|फोटो)(?:$|[\s,.:;।॥)\]-])/gui,
  },
]

/** Devanagari digit to ASCII map */
const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
}

function normalizeForMatching(text: string): string {
  let s = text.toLowerCase()

  // Devanagari digits to ASCII
  s = s.replace(/[०-९]/g, ch => DEVANAGARI_DIGITS[ch] ?? ch)

  // Normalize connectors
  s = s.replace(/(\d)\s*[×*]\s*(\d)/g, '$1 x $2')
  s = s.replace(/(\d)\s+(?:by|bai|cross|into)\s+(\d)/g, '$1 x $2')
  s = s.replace(/(\d)x(\d)/g, '$1 x $2')

  // Units
  s = s.replace(/kilobytes?|kilo[\s]?bytes?|k\.b\.|केबी/g, 'kb')
  s = s.replace(/megabytes?|mega[\s]?bytes?|m\.b\./g, 'mb')
  s = s.replace(/(\d+(?:\.\d+)?)\s*mb\b/g, (_, n) => `${Math.round(parseFloat(n) * 1024)} kb`)
  s = s.replace(/pixels?|pix|p\.x\./g, 'px')
  s = s.replace(/centim[ée]tres?|centimeters?|c\.m\./g, 'cm')
  s = s.replace(/millim[ée]tres?|millimeters?|m\.m\./g, 'mm')

  // Collapse whitespaces
  s = s.replace(/\s+/g, ' ')

  return s
}

function extractIntentsFromSegment(normText: string, defaultDpi = 300): Intent[] {
  const intents: Intent[] = []

  // 1. CM / MM Dimensions (handles 3.5 x 4.5 cm, width 3.5 cm x height 4.5 cm, 35x45 mm, etc.)
  const mmMatch = normText.match(/(?:width\s*(?:is|:|=)?\s*)?(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:x|by|and|,|\*)\s*(?:height\s*(?:is|:|=)?\s*)?(\d+(?:\.\d+)?)\s*mm\b/i)
  const cmMatch = normText.match(/(?:width\s*(?:is|:|=)?\s*)?(\d+(?:\.\d+)?)\s*(?:cm)?\s*(?:x|by|and|,|\*)\s*(?:height\s*(?:is|:|=)?\s*)?(\d+(?:\.\d+)?)\s*cm\b/i)

  if (mmMatch) {
    const w = parseFloat(mmMatch[1]) / 10
    const h = parseFloat(mmMatch[2]) / 10
    if (w > 0 && h > 0) {
      intents.push({ kind: 'resize_cm', widthCm: w, heightCm: h, dpi: defaultDpi })
    }
  } else if (cmMatch) {
    const w = parseFloat(cmMatch[1])
    const h = parseFloat(cmMatch[2])
    if (w > 0 && h > 0) {
      intents.push({ kind: 'resize_cm', widthCm: w, heightCm: h, dpi: defaultDpi })
    }
  } else {
    // 2. Pixel Dimensions
    const pxMatch = normText.match(/(?:width\s*(?:is|:|=)?\s*)?(\d+)\s*(?:px)?\s*(?:x|by|and|,|\*)\s*(?:height\s*(?:is|:|=)?\s*)?(\d+)\s*(?:px|pixels?)\b/i)
      || normText.match(/dimensions?\s*(?:of|:)?\s*(\d+)\s*x\s*(\d+)/i)
      || normText.match(/(\d+)\s*x\s*(\d+)(?!\s*(?:cm|mm|in|inch))\b/i)

    if (pxMatch) {
      const w = parseInt(pxMatch[1], 10)
      const h = parseInt(pxMatch[2], 10)
      if (w >= 40 && h >= 40) {
        intents.push({ kind: 'resize_px', width: w, height: h })
      }
    }
  }

  // 3. KB Range
  const rangeMatch = normText.match(/(?:between\s+)?(\d+)\s*(?:kb)?\s*(?:to|-|–|se|से|and)\s*(\d+)\s*kb\b/iu)
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1], 10)
    const hi = parseInt(rangeMatch[2], 10)
    if (lo > 0 && hi > 0) {
      intents.push({ kind: 'min_kb', kb: Math.min(lo, hi) })
      intents.push({ kind: 'max_kb', kb: Math.max(lo, hi) })
    }
  } else {
    // 4. Standalone Max KB (handles "maximum file size 50 kb", "not more than 50 kb", "up to 50 kb", etc.)
    const maxMatch = normText.match(/(?:max(?:imum)?|not\s+more\s+than|not\s+exceed(?:ing)?|up\s*to|below|under|less\s+than|within|compress\s+to)\s+(?:file\s+size|size\s+of\s+file|size|image\s+size)?\s*(?:is|of|:|=)?\s*(\d+)\s*kb\b/iu)
      || normText.match(/(\d+)\s*kb\s*(?:(?:se|से)\s*(?:kam|कम|andar|अंदर)|tak|तक|max(?:imum)?)\b/iu)
      || normText.match(/size\s+(?:should\s+be\s+)?(?:less\s+than|under|below|max(?:imum)?)\s*(\d+)\s*kb\b/iu)

    if (maxMatch) {
      const kb = parseInt(maxMatch[1], 10)
      if (kb > 0) intents.push({ kind: 'max_kb', kb })
    }

    // 5. Standalone Min KB
    const minMatch = normText.match(/(?:min(?:imum)?|at\s+least|not\s+less\s+than|above|more\s+than)\s+(?:file\s+size|size\s+of\s+file|size|image\s+size)?\s*(?:is|of|:|=)?\s*(\d+)\s*kb\b/iu)
      || normText.match(/(\d+)\s*kb\s*(?:(?:se|से)\s*(?:zyada|ज्यादा|upar|ऊपर)|minimum)\b/iu)

    if (minMatch) {
      const kb = parseInt(minMatch[1], 10)
      if (kb > 0) intents.push({ kind: 'min_kb', kb })
    }
  }

  // 6. Format
  const fmtMatch = normText.match(/\b(jpe?g|png)\b/i)
  if (fmtMatch) {
    const rawFmt = fmtMatch[1].toLowerCase()
    intents.push({ kind: 'format', format: rawFmt === 'png' ? 'png' : 'jpeg' })
  }

  // 7. White background
  if (/(?:plain\s+|light\s+)?white\s+background|background\s+(?:should\s+be\s+)?(?:plain\s+|light\s+)?white|safed\s+background/i.test(normText)) {
    intents.push({ kind: 'white_bg' })
  }

  return intents
}

function deduplicateIntents(intents: Intent[]): Intent[] {
  const result: Intent[] = []
  const seenSingleton = new Set<string>()

  // Preserve later singleton intents
  for (let i = intents.length - 1; i >= 0; i--) {
    const item = intents[i]
    let key = item.kind as string
    if (key === 'resize_px' || key === 'resize_cm') key = '__resize__'

    if (!seenSingleton.has(key)) {
      seenSingleton.add(key)
      result.unshift(item)
    }
  }

  return result
}

function calculateConfidence(intents: Intent[]): number {
  if (intents.length === 0) return 0
  const hasDim = intents.some(i => i.kind === 'resize_px' || i.kind === 'resize_cm')
  const hasSize = intents.some(i => i.kind === 'max_kb' || i.kind === 'min_kb')
  const hasFmt = intents.some(i => i.kind === 'format')

  if (hasDim && hasSize && hasFmt) return 0.98
  if (hasDim && hasSize) return 0.95
  if (hasDim || hasSize) return 0.85
  return 0.70
}

function cleanSnippet(rawText: string, maxLength = 140): string {
  const clean = rawText.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength)}…`
}

/**
 * Main notice extractor function.
 * Never throws.
 */
export function extractNoticeRules(
  raw: string,
  opts?: ExtractOptions
): NoticeExtractionResult {
  const defaultDpi = opts?.defaultDpi ?? 300
  const activeSlot = opts?.activeSlot ?? 'photo'

  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return {
      proposals: [],
      unparsedNotice: true,
      rawNotice: raw || '',
    }
  }

  try {
    // 1. Locate all slot matches in the raw text
    const allMatches: SlotMatch[] = []
    for (const { slot, regex } of SLOT_PATTERNS) {
      let m: RegExpExecArray | null
      const reg = new RegExp(regex.source, 'gi')
      while ((m = reg.exec(raw)) !== null) {
        allMatches.push({
          slot,
          index: m.index,
          length: m[0].length,
        })
      }
    }

    // Sort by index ascending
    allMatches.sort((a, b) => a.index - b.index)

    // Remove overlapping matches
    const nonOverlapping: SlotMatch[] = []
    let lastEnd = -1
    for (const match of allMatches) {
      if (match.index >= lastEnd) {
        nonOverlapping.push(match)
        lastEnd = match.index + match.length
      }
    }

    // 2. Segment text
    interface RawSegment {
      slot: SlotId
      rawText: string
    }
    const segments: RawSegment[] = []

    if (nonOverlapping.length === 0) {
      // No slot keyword found: assign whole text to activeSlot
      segments.push({
        slot: activeSlot,
        rawText: raw,
      })
    } else {
      for (let i = 0; i < nonOverlapping.length; i++) {
        const cur = nonOverlapping[i]
        const next = nonOverlapping[i + 1]
        const start = cur.index
        const end = next ? next.index : raw.length
        const rawText = raw.slice(start, end).trim()
        if (rawText) {
          segments.push({
            slot: cur.slot,
            rawText,
          })
        }
      }
    }

    // 3. Extract rules per segment & merge segments of the same slot
    const slotMap = new Map<SlotId, { intents: Intent[]; snippets: string[] }>()

    for (const seg of segments) {
      const norm = normalizeForMatching(seg.rawText)
      const extracted = extractIntentsFromSegment(norm, defaultDpi)
      if (extracted.length > 0) {
        const existing = slotMap.get(seg.slot)
        if (existing) {
          existing.intents.push(...extracted)
          existing.snippets.push(cleanSnippet(seg.rawText))
        } else {
          slotMap.set(seg.slot, {
            intents: extracted,
            snippets: [cleanSnippet(seg.rawText)],
          })
        }
      }
    }

    // 4. Build proposals
    const proposals: NoticeProposal[] = []
    for (const [slot, { intents, snippets }] of slotMap.entries()) {
      const deduped = deduplicateIntents(intents)
      if (deduped.length > 0) {
        proposals.push({
          slot,
          intents: deduped,
          confidence: calculateConfidence(deduped),
          sourceSnippet: snippets.join(' | '),
        })
      }
    }

    return {
      proposals,
      unparsedNotice: proposals.length === 0,
      rawNotice: raw,
    }
  } catch {
    // Zero-crash guarantee
    return {
      proposals: [],
      unparsedNotice: true,
      rawNotice: raw,
    }
  }
}
